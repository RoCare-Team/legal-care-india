import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';

// Presence is live — never cache this response.
export const dynamic = 'force-dynamic';

/**
 * GET /api/presence — the ids of advocates who are currently online (they
 * flipped their availability switch on). The public cards/profile poll this so
 * the online/offline badge updates without a page refresh.
 */
export async function GET() {
  try {
    await connectDB();
    const rows = await Advocate.find({ available: true, status: 'published' })
      .select('_id')
      .lean();
    const online = rows.map((r) => String(r._id));
    return NextResponse.json({ online }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.warn('presence: DB unavailable', err);
    return NextResponse.json({ online: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
