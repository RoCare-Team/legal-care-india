import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getSessionUserId } from '@/lib/auth';
import { getServiceBySlug, quoteService } from '@/lib/legalServices';

export const dynamic = 'force-dynamic';

/**
 * POST /api/marketplace/quote  { slug, couponCode, useWallet }
 *
 * What the order summary shows, worked out server-side: base, discount, GST,
 * how much of the wallet would go towards it, and what is left for Razorpay.
 * The screen that follows this one sends the same slug and coupon to
 * /orders, which prices it again from the catalogue — so a quote is a preview,
 * never a promise the client can hold us to by editing it.
 *
 * A rejected coupon comes back as `couponError` with the rest of the totals
 * intact, rather than as a failed request: the summary still has to render.
 */
export async function POST(request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Please sign in to continue.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const slug = String(body?.slug || '').trim();
  if (!slug) {
    return NextResponse.json({ error: 'Which service?' }, { status: 400 });
  }

  try {
    const service = await getServiceBySlug(slug);
    if (!service) {
      return NextResponse.json(
        { error: 'That service is no longer available.' },
        { status: 404 }
      );
    }

    await connectDB();
    const user = await User.findById(userId).select('walletBalance').lean();
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    const quote = await quoteService({
      service,
      couponCode: body?.couponCode || '',
      userId,
      walletBalance: user.walletBalance,
      useWallet: Boolean(body?.useWallet),
    });

    return NextResponse.json({
      service: {
        id: service.id,
        slug: service.slug,
        title: service.title,
        category: service.category,
        price: service.price,
        mrp: service.mrp,
      },
      ...quote,
    });
  } catch (err) {
    console.error('legal service quote error', err);
    return NextResponse.json({ error: 'Could not price that order.' }, { status: 500 });
  }
}
