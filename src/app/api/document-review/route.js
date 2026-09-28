import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/users';
import { getRazorpay, toPaise } from '@/lib/razorpay';
import { getPaymentConfig } from '@/lib/paymentSettings';
import { createReview, setReviewOrder, payReviewFromWallet } from '@/lib/documentReviews';
import { isReviewAiConfigured } from '@/lib/ai/documentReview';

export const dynamic = 'force-dynamic';

/**
 * POST /api/document-review   (multipart form-data)
 *   kind: 'ai' | 'expert', file: PDF/JPG/PNG ≤ 5 MB, area?, question?
 *
 * Step 1 of a review: store the document privately and price it from the
 * file (flat for AI, by the page for a lawyer). If the client's wallet covers
 * the price it is paid from there and the review starts at once
 * (→ { paid: true, reviewId }); otherwise a Razorpay order is opened and
 * nothing is read until /api/document-review/verify (or the webhook)
 * confirms the payment.
 */
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json({ error: 'Please sign in as a client to get a review.' }, { status: 401 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }
  const kind = String(form.get('kind') || '');
  if (kind === 'ai' && !isReviewAiConfigured()) {
    return NextResponse.json({ error: 'AI review is not available right now. Try a lawyer review.' }, { status: 503 });
  }

  try {
    const user = await getUserById(session.id);
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const review = await createReview({
      user: { ...user, id: session.id },
      kind,
      file: form.get('file'),
      area: String(form.get('area') || ''),
      question: String(form.get('question') || ''),
    });

    if (await payReviewFromWallet(review)) {
      return NextResponse.json({ paid: true, paidWith: 'wallet', reviewId: String(review._id), price: review.amount });
    }

    const config = await getPaymentConfig();
    if (!config.keyId || !config.keySecret) {
      return NextResponse.json(
        { error: 'Your wallet balance is too low and online payments are not set up yet. Add money to your wallet first.' },
        { status: 503 }
      );
    }

    const rzp = await getRazorpay();
    const order = await rzp.orders.create({
      amount: toPaise(review.amount),
      currency: 'INR',
      receipt: `d_${String(review._id).slice(-12)}_${Date.now().toString(36)}`,
      notes: { purpose: 'document_review', reviewId: String(review._id), userId: String(session.id), kind },
    });
    await setReviewOrder(review._id, order.id);

    return NextResponse.json({
      reviewId: String(review._id),
      pages: review.pages,
      price: review.amount,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.keyId,
      prefill: { name: user.name || '', email: user.email || '', contact: user.phone || '' },
    });
  } catch (err) {
    if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('document review order error', err);
    return NextResponse.json({ error: 'Could not start the review. Please try again.' }, { status: 502 });
  }
}
