import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { verifyApplePurchase } from '@/lib/appleIap';

export const dynamic = 'force-dynamic';
// A document check runs its AI read before answering, as the Razorpay verify does.
export const maxDuration = 120;

/**
 * POST /api/iap/apple/verify — an iOS In-App Purchase, after Apple has taken
 * the payment. Signed-in accounts only (the usual cookie).
 *
 *   { productId, transactionId, signedTransaction, reviewId?, planId? }
 *
 *   200 { ok, kind: 'document-review', reviewId, review }
 *   200 { ok, kind: 'membership', planId, planName, expiresAt }
 *   409 { error: 'already_used' }  granted earlier — the app finishes the transaction
 *   503 { error: 'busy' }          another request is processing it — retry later
 *   4xx / 5xx                      failed — the app keeps it unfinished and retries
 *
 * See lib/appleIap for the checks: Apple's signature (Production, then
 * Sandbox), bundle and product match, not revoked, claimed exactly once.
 */
export async function POST(request) {
  const session = await getSession();
  if (!session || (session.role !== 'user' && session.role !== 'advocate')) {
    return NextResponse.json({ error: 'unauthorized', message: 'Please sign in.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid', message: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const answer = await verifyApplePurchase({ session, body });
    return NextResponse.json(answer);
  } catch (err) {
    if (err?.status) {
      return NextResponse.json({ error: err.code || 'failed', message: err.message }, { status: err.status });
    }
    console.error('apple iap verify', err);
    return NextResponse.json({ error: 'failed', message: 'Could not apply the purchase.' }, { status: 500 });
  }
}
