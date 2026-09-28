import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAdminSession } from '@/lib/admin';
import { readReviewFile, reviewFileResponse } from '@/lib/documentReviews';

export const dynamic = 'force-dynamic';

/**
 * GET /api/document-review/<id>/file — the uploaded document, for its client,
 * the lawyer it is assigned to, or an admin. Never cached, never public.
 */
export async function GET(_request, { params }) {
  const { id } = await params;
  const [session, admin] = await Promise.all([getSession(), getAdminSession()]);
  const viewer = {
    admin: Boolean(admin),
    userId: session?.role === 'user' ? session.id : null,
    advocateId: session?.role === 'advocate' ? session.id : null,
  };
  if (!viewer.admin && !viewer.userId && !viewer.advocateId) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }
  const file = await readReviewFile(id, viewer);
  if (!file) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return reviewFileResponse(file);
}
