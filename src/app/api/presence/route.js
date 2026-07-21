import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { ONLINE_WINDOW_MS } from '@/lib/consultations';

// Presence is live — never cache this response.
export const dynamic = 'force-dynamic';

/**
 * GET /api/presence — the ids of lawyers who are currently online. Being
 * online takes BOTH signals: the lawyer flipped their availability switch on
 * AND their call listener has checked in recently (i.e. they actually have the
 * site open). Leaving the toggle on and closing the tab shows Offline, so a
 * visitor is never told someone is reachable when they aren't.
 */
export async function GET() {
  try {
    await connectDB();
    const since = new Date(Date.now() - ONLINE_WINDOW_MS);
    const rows = await Advocate.find({
      available: true,
      status: 'published',
      lastSeenAt: { $gte: since },
    })
      .select('_id')
      .lean();
    const online = rows.map((r) => String(r._id));
    return NextResponse.json({ online }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.warn('presence: DB unavailable', err);
    return NextResponse.json({ online: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
