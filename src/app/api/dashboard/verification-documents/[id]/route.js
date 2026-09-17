import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { readVerificationDocument, documentResponse } from '@/lib/verificationDocuments';

export const dynamic = 'force-dynamic';

/** GET /api/dashboard/verification-documents/<id> — the lawyer's own file. */
export async function GET(_request, { params }) {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const { id } = await params;
  const doc = await readVerificationDocument(id, { advocateId });
  if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return documentResponse(doc);
}
