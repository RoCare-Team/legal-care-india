import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, addWalletFunds } from '@/lib/users';

// A sensible cap so a typo can't add a crore by accident.
const MAX_TOPUP = 100000; // ₹1,00,000 per top-up

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
 * POST /api/wallet  { amount }
 * The signed-in user tops up their own wallet by `amount` (₹).
 */
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json({ error: 'Please sign in to add money.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Enter a valid amount.' }, { status: 400 });
  }
  if (amount > MAX_TOPUP) {
    return NextResponse.json(
      { error: `You can add up to ₹${MAX_TOPUP.toLocaleString('en-IN')} at a time.` },
      { status: 400 }
    );
  }

  try {
    const user = await addWalletFunds(session.id, amount, 'Added to wallet');
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    return NextResponse.json({
      ok: true,
      balance: user.walletBalance,
      transactions: user.walletTransactions,
    });
  } catch (err) {
    console.error('wallet top-up error', err);
    return NextResponse.json({ error: 'Could not add money. Please try again.' }, { status: 500 });
  }
}
