import { SignedDataVerifier, Environment } from '@apple/app-store-server-library';
import { connectDB } from '@/lib/db';
import AppleTransaction from '@/models/AppleTransaction';
import DocumentReview from '@/models/DocumentReview';
import { APPLE_ROOT_CERTIFICATES } from '@/lib/appleRootCerts';
import { markReviewPaid, runAiReview, serializeReview } from '@/lib/documentReviews';
import { grantMembership } from '@/lib/membership';
import { annualTotal } from '@/constants/membershipPlans';

/**
 * Apple In-App Purchase on iOS.
 *
 * Under App Store Guideline 3.1.1 the iOS app sells the digital items used in
 * the app through Apple: the Smart Document Check and the lawyer plans.
 * Everything else (wallet, consultations, marketplace, Advocate Document
 * Opinion) stays on Razorpay. Android is unchanged.
 *
 * The app sends the StoreKit 2 signed transaction (a JWS). It is checked
 * offline against Apple's root certificates — no App Store API key needed —
 * then claimed once and turned into the same grant a Razorpay payment makes,
 * through the same functions.
 */

export const BUNDLE_ID = 'com.justiceland.care';
const APP_APPLE_ID = 6813851582;

/** Apple product id → what it buys. */
export const APPLE_PRODUCTS = {
  'com.justiceland.care.doccheck.ai': { kind: 'document-review' },
  'com.justiceland.care.plan.professional': { kind: 'membership', planId: 'professional' },
  'com.justiceland.care.plan.premium': { kind: 'membership', planId: 'premium' },
};

export const DOC_CHECK_PRODUCT_ID = 'com.justiceland.care.doccheck.ai';

/**
 * The iOS price is the Android/website price plus this share, to cover what
 * Apple keeps from an In-App Purchase. 0.15 = 15% more.
 */
export const IOS_PRICE_MARKUP = 0.15;

/**
 * Fixed iOS prices, in rupees, for plans set to a specific App Store price
 * point rather than the markup — Apple only sells at its own price points, so
 * this must match what App Store Connect charges. A plan not listed here
 * falls back to the total + IOS_PRICE_MARKUP.
 */
export const IOS_PLAN_PRICES = {
  professional: 3249,
};

/** What a plan costs on iOS, in whole rupees. */
export function iosPrice(total, planId = '') {
  if (IOS_PLAN_PRICES[planId]) return IOS_PLAN_PRICES[planId];
  const n = Number(total) || 0;
  return n > 0 ? Math.round(n * (1 + IOS_PRICE_MARKUP)) : 0;
}

/** The Apple product for a paid plan, '' for the free one. */
export function applePlanProductId(planId) {
  return planId && planId !== 'free' ? `com.justiceland.care.plan.${planId}` : '';
}

let verifiers = null;
function getVerifiers() {
  if (!verifiers) {
    verifiers = {
      production: new SignedDataVerifier(APPLE_ROOT_CERTIFICATES, true, Environment.PRODUCTION, BUNDLE_ID, APP_APPLE_ID),
      sandbox: new SignedDataVerifier(APPLE_ROOT_CERTIFICATES, true, Environment.SANDBOX, BUNDLE_ID),
    };
  }
  return verifiers;
}

/**
 * The verified, decoded transaction. Production first, then Sandbox — App
 * Review and TestFlight buy in Sandbox against this live server, and
 * rejecting those gets the build rejected. Throws if Apple did not sign it.
 */
async function decodeTransaction(signedTransaction) {
  const v = getVerifiers();
  try {
    return await v.production.verifyAndDecodeTransaction(signedTransaction);
  } catch {
    return v.sandbox.verifyAndDecodeTransaction(signedTransaction);
  }
}

function fail(status, error, message) {
  const e = new Error(message);
  e.status = status;
  e.code = error;
  return e;
}

/**
 * The payment reference stored on what it bought. Sandbox purchases carry
 * their own prefix so the admin ledger can leave them out of revenue.
 */
function paymentRef(tx) {
  return `${tx.environment === Environment.SANDBOX ? 'apple-sandbox' : 'apple'}:${tx.transactionId}`;
}

/**
 * Verify a StoreKit 2 purchase and grant what it bought, exactly once.
 *
 * Answers (thrown errors carry `status` + `code`):
 *   200 — granted now
 *   409 already_used — granted earlier (a redelivery); the app finishes it
 *   503 busy — another request holds the claim; the app retries next launch
 *   4xx/5xx — failed; the claim is released so the retry can go through
 *
 * Never 409 for a transaction that is not granted: the app treats 409 as done.
 *
 * @param {{session: {id:string, role:string}, body: object}} input
 */
export async function verifyApplePurchase({ session, body }) {
  const productId = String(body?.productId || '');
  const transactionId = String(body?.transactionId || '');
  const signedTransaction = String(body?.signedTransaction || '');
  const product = APPLE_PRODUCTS[productId];
  if (!product || !transactionId || !signedTransaction) {
    throw fail(400, 'invalid', 'Invalid purchase.');
  }

  // A document check is a client's; a plan is a lawyer's.
  const wantRole = product.kind === 'membership' ? 'advocate' : 'user';
  if (session.role !== wantRole) {
    throw fail(403, 'wrong_account', wantRole === 'advocate'
      ? 'Plans can only be bought from a lawyer account.'
      : 'The document check can only be bought from a client account.');
  }

  let tx;
  try {
    tx = await decodeTransaction(signedTransaction);
  } catch (err) {
    console.warn('apple iap: could not verify transaction', err?.status ?? err?.message);
    throw fail(400, 'invalid', 'Apple could not confirm this purchase.');
  }
  if (
    tx.bundleId !== BUNDLE_ID ||
    tx.productId !== productId ||
    String(tx.transactionId) !== transactionId ||
    tx.revocationDate
  ) {
    throw fail(400, 'invalid', 'Apple could not confirm this purchase.');
  }

  await connectDB();

  // Claim first: the unique index makes a second request for the same
  // transaction lose here, before anything is granted.
  try {
    await AppleTransaction.create({
      transactionId,
      originalTransactionId: String(tx.originalTransactionId || ''),
      productId,
      accountId: session.id,
      accountRole: session.role,
      environment: tx.environment || '',
      purchaseDate: tx.purchaseDate ? new Date(tx.purchaseDate) : null,
      planId: product.planId || '',
    });
  } catch (err) {
    if (err?.code !== 11000) throw err;
    const existing = await AppleTransaction.findOne({ transactionId }).lean();
    if (existing?.status === 'granted') {
      throw fail(409, 'already_used', 'This purchase is already applied.');
    }
    throw fail(503, 'busy', 'Please try again in a moment.');
  }

  try {
    let answer;
    const ref = paymentRef(tx);

    if (product.kind === 'document-review') {
      // The unpaid check this purchase is for: the one named, or the newest.
      const query = { userId: session.id, kind: 'ai', status: 'pending' };
      const reviewId = String(body?.reviewId || '');
      const review = reviewId && /^[a-f0-9]{24}$/i.test(reviewId)
        ? await DocumentReview.findOne({ ...query, _id: reviewId }).lean()
        : await DocumentReview.findOne(query).sort({ createdAt: -1 }).lean();
      if (!review) throw fail(404, 'not_found', 'No unpaid document check found for this purchase.');

      const paid = await markReviewPaid({
        reviewId: String(review._id),
        paymentId: ref,
        amountPaise: Math.round((review.amount || 0) * 100),
      });
      if (!paid.ok) throw fail(400, 'not_applied', `The document check could not be marked paid (${paid.error}).`);
      await DocumentReview.updateOne({ _id: review._id }, { $set: { paidWith: 'apple' } });

      let result = paid.review;
      try {
        // As /api/document-review/verify does. Paid is paid even if the read
        // fails: opening the review in the app runs it again.
        result = await runAiReview(review._id);
      } catch (err) {
        console.error('apple iap: AI read after payment failed', err);
      }
      await AppleTransaction.updateOne({ transactionId }, { $set: { reviewId: String(review._id) } });
      answer = { ok: true, kind: 'document-review', reviewId: String(review._id), review: serializeReview(result) };
    } else {
      const granted = await grantMembership({
        advocateId: session.id,
        planId: product.planId,
        paymentId: ref,
        orderId: `apple:${tx.originalTransactionId || transactionId}`,
        // Apple's price is set to the plan's own, so the plan's amount is what
        // was paid; grantMembership checks it against the table.
        amountPaise: annualTotal(product.planId).total * 100,
        source: 'apple',
      });
      if (!granted.ok) throw fail(granted.status || 400, 'not_applied', granted.error || 'The plan could not be applied.');
      answer = {
        ok: true,
        kind: 'membership',
        planId: granted.planId,
        planName: granted.planName,
        expiresAt: granted.expiresAt ? new Date(granted.expiresAt).toISOString() : null,
      };
    }

    await AppleTransaction.updateOne({ transactionId }, { $set: { status: 'granted', grantedAt: new Date() } });
    return answer;
  } catch (err) {
    // Release the claim so the app's retry (on its next launch) can go through.
    await AppleTransaction.deleteOne({ transactionId, status: 'processing' }).catch(() => {});
    throw err;
  }
}
