import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession, adminGetLiveConsultations } from '@/lib/admin';
import {
  adminSetSessionDiscount,
  adminClearSessionDiscount,
  adminEndSession,
} from '@/lib/consultations';

export const dynamic = 'force-dynamic';

/**
 * The admin panel's live-session desk.
 *
 * GET  → every consultation happening right now, plus `serverNow` so the panel
 *        can run its clocks against our clock rather than the viewer's, which
 *        can be minutes out and would show a wrong running bill.
 * POST → { id, action: 'discount' | 'clear-discount' | 'end' }
 *
 * Admin only. Discounts are stored against the session and applied when it
 * settles, so the panel can change or drop one right up to the moment the
 * session ends (see constants/discounts).
 */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  try {
    const sessions = await adminGetLiveConsultations();
    return NextResponse.json(
      { sessions, serverNow: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('GET /api/admin/consultations', err);
    return NextResponse.json({ error: 'Could not load live sessions.' }, { status: 500 });
  }
}

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
  if (!id) return NextResponse.json({ error: 'Which consultation?' }, { status: 400 });

  try {
    let session;
    if (body.action === 'discount') {
      session = await adminSetSessionDiscount(id, body, admin.email);
    } else if (body.action === 'clear-discount') {
      session = await adminClearSessionDiscount(id);
    } else if (body.action === 'end') {
      session = await adminEndSession(id, admin.email);
    } else {
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }

    revalidatePath('/admin/consultations');
    revalidatePath(`/admin/consultations/${id}`);
    return NextResponse.json({ ok: true, session });
  } catch (err) {
    if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('POST /api/admin/consultations', err);
    return NextResponse.json({ error: 'Could not update the session.' }, { status: 500 });
  }
}
