import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin';
import { adminSetPlan, adminCancelPlan, adminResetQueryCredits } from '@/lib/adminMembership';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/advocates/plan
 *   { id, action: 'set', planId, months? | endDate?, extend?, amount?, note? }
 *   { id, action: 'cancel', note? }
 *   { id, action: 'reset-credits' }
 *
 * Hand-managing a lawyer's membership. Admin only. Online purchases keep going
 * through /api/membership; this is for everything that does not.
 */
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
  if (!id) return NextResponse.json({ error: 'Which lawyer?' }, { status: 400 });

  try {
    let result;
    if (body.action === 'set') result = await adminSetPlan(id, body, admin.email);
    else if (body.action === 'cancel') result = await adminCancelPlan(id, body.note, admin.email);
    else if (body.action === 'reset-credits') result = await adminResetQueryCredits(id, admin.email);
    else return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });

    revalidatePath(`/admin/advocates/${id}`);
    revalidatePath('/admin/advocates');
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('admin plan change error', err);
    return NextResponse.json({ error: 'Could not update the plan.' }, { status: 500 });
  }
}
