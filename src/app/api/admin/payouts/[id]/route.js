import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { adminMarkPaid, adminRejectPayout } from '@/lib/payouts';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/payouts/<id>
 *   { action: 'paid', utr, note? }   — the transfer was made
 *   { action: 'reject', reason }     — refused; the amount returns to the lawyer
 *
 * Only a payout still waiting can be closed, and only once: the status check is
 * part of the update, so two admins clicking at once cannot both act on it.
 */
export async function PATCH(request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    if (body?.action === 'paid') {
      await adminMarkPaid(id, { utr: body.utr, note: body.note, adminEmail: admin.email || 'admin' });
    } else if (body?.action === 'reject') {
      await adminRejectPayout(id, { reason: body.reason, adminEmail: admin.email || 'admin' });
    } else {
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('admin payout action', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
