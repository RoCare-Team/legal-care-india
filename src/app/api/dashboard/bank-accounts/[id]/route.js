import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { removeBankAccount, setPrimaryBankAccount } from '@/lib/payouts';
import { payoutErrorResponse } from '@/lib/payoutResponses';

export const dynamic = 'force-dynamic';

/** PATCH /api/dashboard/bank-accounts/<id>  { action: 'primary' } */
export async function PATCH(request, { params }) {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { id } = await params;
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* handled below */
  }
  if (body?.action !== 'primary') {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  try {
    await setPrimaryBankAccount(advocateId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return payoutErrorResponse(err, 'bank account primary');
  }
}

/**
 * DELETE /api/dashboard/bank-accounts/<id>
 *
 * Past payouts keep their own copy of the account, so removing one never
 * changes where an earlier payout says it went.
 */
export async function DELETE(_request, { params }) {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { id } = await params;
  try {
    await removeBankAccount(advocateId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return payoutErrorResponse(err, 'bank account remove');
  }
}
