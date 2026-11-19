import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CampaignMedia from '@/models/CampaignMedia';

/**
 * GET /api/campaign-media/[id] — a WhatsApp campaign's header image.
 *
 * Public on purpose: WhatsApp fetches it from here when it delivers the
 * message. The image never changes once uploaded, so it is cached for a year.
 */
export async function GET(_request, { params }) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return new NextResponse(null, { status: 404 });

  try {
    await connectDB();
    const doc = await CampaignMedia.findById(id).select('contentType data').lean();
    if (!doc) return new NextResponse(null, { status: 404 });
    const body = Buffer.from(doc.data.buffer || doc.data);
    return new NextResponse(body, {
      headers: {
        'Content-Type': doc.contentType,
        'Content-Length': String(body.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('campaign media read failed', err);
    return new NextResponse(null, { status: 404 });
  }
}
