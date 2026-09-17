import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import {
  saveVerificationDocument, listVerificationDocuments,
} from '@/lib/verificationDocuments';

export const dynamic = 'force-dynamic';

/**
 * GET  /api/dashboard/verification-documents
 *   → { documents: [{ id, kind, label, fileName, mimeType, size, uploadedAt }] }
 *
 * POST /api/dashboard/verification-documents   (multipart form-data)
 *   kind: 'bar_council_certificate' | 'government_id'
 *   file: PDF, JPG or PNG, max 5 MB
 *   → 201 { document }
 *
 * The signed-in lawyer's own verification documents. Uploading a kind again
 * replaces the earlier file.
 */
export async function GET() {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const documents = await listVerificationDocuments(advocateId);
  return NextResponse.json({ documents });
}

export async function POST(request) {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }

  try {
    const document = await saveVerificationDocument(
      advocateId,
      String(form.get('kind') || ''),
      form.get('file')
    );
    return NextResponse.json({ ok: true, document }, { status: 201 });
  } catch (err) {
    if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('verification document upload failed', err);
    return NextResponse.json({ error: 'Could not save the document. Please try again.' }, { status: 500 });
  }
}
