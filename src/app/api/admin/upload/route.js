import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getAdminSession } from '@/lib/admin';
import { slugify } from '@/utils/slugify';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

/**
 * POST /api/admin/upload  (multipart form-data, field: "file")
 * Admin-only. Saves an uploaded image under /public/uploads and returns its
 * public URL. Used by the admin "Add city" form.
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

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return NextResponse.json({ error: 'Please choose a JPG, PNG, WebP, AVIF or GIF image.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: 'Image is too large (max 5 MB).' }, { status: 400 });
  }

  // Unique, safe filename derived from the original name.
  const base = slugify((file.name || 'image').replace(/\.[^.]+$/, '')).slice(0, 40) || 'image';
  const filename = `${base}-${Date.now()}.${ext}`;

  try {
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error('upload error', err);
    return NextResponse.json({ error: 'Could not save the image.' }, { status: 500 });
  }
}
