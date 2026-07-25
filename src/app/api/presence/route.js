import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';

// Presence is live — never cache this response.
export const dynamic = 'force-dynamic';

/**
 * GET /api/presence — the ids of lawyers who are currently online.
 *
 * Online means one thing: the lawyer has their own availability switch on. It
 * used to also require a recent heartbeat from an open tab, which showed a
 * lawyer as Offline the moment they closed the site even though they had said
 * they were available — and a phone call reaches them either way. Their switch
 * is their word on it; turning it off takes them offline everywhere at once.
 */
export async function GET() {
  try {
    await connectDB();
    const rows = await Advocate.find({
      available: true,
      status: 'published',
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
