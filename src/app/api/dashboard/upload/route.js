import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { lawyerImageResponse } from '@/lib/imageUpload';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/dashboard/upload   (multipart form-data)
 *   file: the image; kind?: 'photo' | 'cover' | 'gallery' (default 'photo')
 *   → { url }  — a resized JPEG data URL, see lib/imageUpload
 *
 * The signed-in lawyer's image upload, for the app. Nothing is saved here;
 * the lawyer still presses Save and the profile update stores the URL.
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
  return lawyerImageResponse(form);
}
