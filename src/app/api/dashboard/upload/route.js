import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getSessionAdvocateId } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Largest file accepted before resizing — a phone camera photo fits. */
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

/**
 * The longest side each kind of image is stored at — the same sizes the
 * website's dashboard resizes to in the browser (see utils/imageFile), so a
 * photo saved from the app and one saved from the website look the same.
 */
const MAX_DIM = { photo: 512, cover: 1600, gallery: 1200 };
const QUALITY = { photo: 82, cover: 80, gallery: 80 };

/**
 * POST /api/dashboard/upload   (multipart form-data)
 *   file: the image; kind?: 'photo' | 'cover' | 'gallery' (default 'photo')
 *   → { url }
 *
 * The signed-in lawyer's image upload, for the app. The website never needed
 * one: it resizes images in the browser and saves them inside the profile as
 * JPEG data URLs. This does the same resize on the server and returns the
 * same kind of data URL, which the app then saves with the profile update —
 * so nothing is written to disk (which would not survive a redeploy) and the
 * stored value is identical whichever client saved it.
 *
 * Nothing is saved here; the lawyer still presses Save.
 */
export async function POST(request) {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No image received.' }, { status: 400 });
  }
  const kind = MAX_DIM[String(form.get('kind') || '')] ? String(form.get('kind')) : 'photo';

  const input = Buffer.from(await file.arrayBuffer());
  if (!input.length) return NextResponse.json({ error: 'The image is empty.' }, { status: 400 });
  if (input.length > MAX_INPUT_BYTES) {
    return NextResponse.json({ error: 'That image is too large. Please pick one under 10 MB.' }, { status: 400 });
  }

  try {
    // Reading it with sharp is also the check that it is an image at all —
    // the name and type the phone sent are not trusted.
    const out = await sharp(input, { failOn: 'error' })
      .rotate() // honour the phone's orientation flag before it is dropped
      .resize({ width: MAX_DIM[kind], height: MAX_DIM[kind], fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }) // transparent PNGs would turn black as JPEG
      .jpeg({ quality: QUALITY[kind], mozjpeg: true })
      .toBuffer();

    return NextResponse.json({ url: `data:image/jpeg;base64,${out.toString('base64')}` });
  } catch {
    return NextResponse.json({ error: 'Please choose a JPG, PNG or WebP image.' }, { status: 400 });
  }
}
