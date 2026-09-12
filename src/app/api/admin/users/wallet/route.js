import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

/**
 * POST /api/admin/users/wallet — move money in a client's wallet, by hand.
 *
 * For the two things an admin actually has to do: put back a consultation that
 * charged for a call which never connected, and correct a top-up that went
 * wrong. Both are real money to the client, so both are written into the same
 * wallet ledger the client sees, with the admin's email on the line — a
 * balance that changed with nothing to explain it is the kind of thing nobody
 * can answer a complaint about later.
 *
 * A deduction is conditional on the balance still covering it, in the update
 * itself rather than in a read beforehand: between reading and writing the
 * client could have spent it on a consultation, and `walletBalance` has a
 * minimum of zero, so the write would fail validation instead of being
 * refused for the right reason.
 */
export const dynamic = 'force-dynamic';

/** Enough for a genuine correction, small enough that a typo cannot run away. */
const MAX_AMOUNT = 200000;

export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const id = String(body?.id || '').trim();
  const action = body?.action === 'debit' ? 'debit' : 'credit';
  const amount = Math.round(Number(body?.amount) || 0);
  const reason = String(body?.note || '').trim().slice(0, 200);

  if (!id) return NextResponse.json({ error: 'Which user?' }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Enter an amount above zero.' }, { status: 400 });
  }
  if (amount > MAX_AMOUNT) {
    return NextResponse.json(
      { error: `Amounts above ₹${MAX_AMOUNT.toLocaleString('en-IN')} have to be done in smaller steps.` },
      { status: 400 }
    );
  }

  // The ledger line says who did it and why, because the client reads this
  // list too and "₹500 credited" on its own explains nothing.
  const who = admin.email ? ` — ${admin.email}` : ' — admin';
  const note = `${reason || (action === 'credit' ? 'Added by admin' : 'Deducted by admin')}${who}`;

  try {
    await connectDB();

    if (action === 'credit') {
      const updated = await User.findByIdAndUpdate(
        id,
        {
          $inc: { walletBalance: amount },
          $push: { walletTransactions: { type: 'credit', amount, note } },
        },
        { new: true, select: 'walletBalance name' }
      );
      if (!updated) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      return NextResponse.json({ ok: true, walletBalance: updated.walletBalance });
    }

    const updated = await User.findOneAndUpdate(
      { _id: id, walletBalance: { $gte: amount } },
      {
        $inc: { walletBalance: -amount },
        $push: { walletTransactions: { type: 'debit', amount, note } },
      },
      { new: true, select: 'walletBalance name' }
    );

    if (!updated) {
      // Either there is no such user, or the balance does not cover it. Say
      // which, with the figure, so the admin does not have to go and look.
      const current = await User.findById(id).select('walletBalance').lean();
      if (!current) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      return NextResponse.json(
        {
          error: `Balance is only ₹${(current.walletBalance || 0).toLocaleString('en-IN')}.`,
          walletBalance: current.walletBalance || 0,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, walletBalance: updated.walletBalance });
  } catch (err) {
    console.error('admin wallet adjust error', err);
    return NextResponse.json({ error: 'Could not update the wallet.' }, { status: 500 });
  }
}
