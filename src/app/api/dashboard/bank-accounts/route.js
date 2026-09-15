import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { addBankAccount } from '@/lib/payouts';
import { payoutErrorResponse } from '@/lib/payoutResponses';

export const dynamic = 'force-dynamic';

/**
 * POST /api/dashboard/bank-accounts
 *   { holderName, accountNumber, ifsc, bankName?, accountType? }
 *
 * Adds a bank account for payouts. The account number is sealed before it is
 * stored and only its last four digits come back.
 */
export async function POST(request) {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const account = await addBankAccount(id, body);
    return NextResponse.json({ ok: true, account }, { status: 201 });
  } catch (err) {
    return payoutErrorResponse(err, 'bank account add');
  }
}
