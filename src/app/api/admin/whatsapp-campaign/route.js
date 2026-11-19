import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { sendWhatsAppCampaign, firstName } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/whatsapp-campaign
 *   { ids: string[], campaign: string, media?: { url, filename } }
 *
 * Admin-only. Sends one WhatsApp template campaign to the chosen lawyers, each
 * greeted by first name (the template's {{1}}), with the uploaded image as
 * the header when there is one.
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

  const campaign = String(body?.campaign || '').trim();
  if (!/^[\w-]{2,80}$/.test(campaign)) {
    return NextResponse.json({ error: 'Enter the campaign name exactly as it is in WhatsApp (letters, numbers, _ or -).' }, { status: 400 });
  }
  const ids = [...new Set((Array.isArray(body?.ids) ? body.ids : []).map(String))].filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );
  if (!ids.length) return NextResponse.json({ error: 'Select at least one lawyer.' }, { status: 400 });

  const mediaUrl = String(body?.media?.url || '').trim();
  if (mediaUrl && !/^https:\/\/\S+$/i.test(mediaUrl)) {
    return NextResponse.json({ error: 'The image link must be an https URL.' }, { status: 400 });
  }

  try {
    await connectDB();
    const lawyers = await Advocate.find({ _id: { $in: ids } }).select('name phone').lean();
    const result = await sendWhatsAppCampaign({
      campaign,
      recipients: lawyers.map((a) => ({ phone: a.phone, params: [firstName(a.name)] })),
      media: mediaUrl ? { url: mediaUrl, filename: body.media.filename || 'image' } : undefined,
    });
    return NextResponse.json({ ...result, selected: ids.length });
  } catch (err) {
    console.error('whatsapp campaign failed', err);
    return NextResponse.json({ error: String(err.message || 'Could not send the campaign.').slice(0, 300) }, { status: 502 });
  }
}
