import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { readVerificationDocument, documentResponse } from '@/lib/verificationDocuments';

export const dynamic = 'force-dynamic';

/** GET /api/admin/advocates/documents/<id> — any lawyer's file, admin only. */
export async function GET(_request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  const { id } = await params;
  const doc = await readVerificationDocument(id);
  if (!doc) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return documentResponse(doc);
}
