import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/users';

/** GET /api/wallet — current user's wallet balance + transactions. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  const user = await getUserById(session.id);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  return NextResponse.json({
    balance: user.walletBalance,
    transactions: user.walletTransactions,
  });
}

/**
 * POST /api/wallet — retired.
 *
 * This used to credit the wallet by whatever number the browser sent, with no
 * payment involved: anyone signed in could give themselves ₹1,00,000 with one
 * fetch from the console. Money now only enters a wallet through a Razorpay
 * payment that the server has verified — /api/wallet/order to start checkout,
 * then /api/wallet/verify (or the webhook) to credit it.
 *
 * Kept as an explicit refusal rather than deleted so an old cached page gets a
 * clear message instead of Next.js's bare 405.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Please add money through the payment screen.' },
    { status: 410 }
  );
}
