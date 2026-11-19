import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import CampaignMedia from '@/models/CampaignMedia';
import { SITE } from '@/constants/site';

export const dynamic = 'force-dynamic';

/** WhatsApp's own limit for a template header image. */
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png' };

/**
 * POST /api/admin/campaign-media  (multipart form-data, field: "file")
 *
 * Admin-only. Stores a campaign header image and returns the public URL
 * WhatsApp will fetch it from: { id, url }.
 */
export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  }
  const ext = TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: 'WhatsApp image headers must be JPG or PNG.' }, { status: 400 });
  }
  const data = Buffer.from(await file.arrayBuffer());
  if (data.length > MAX_BYTES) {
    return NextResponse.json({ error: 'Image is too large — WhatsApp allows up to 5 MB.' }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await CampaignMedia.create({
      contentType: file.type === 'image/jpg' ? 'image/jpeg' : file.type,
      filename: `campaign.${ext}`,
      data,
      size: data.length,
      uploadedBy: admin.email || '',
    });
    const id = String(doc._id);
    return NextResponse.json({ id, url: `${SITE.url}/api/campaign-media/${id}`, filename: doc.filename });
  } catch (err) {
    console.error('campaign media upload failed', err);
    return NextResponse.json({ error: 'Could not save the image.' }, { status: 500 });
  }
}
