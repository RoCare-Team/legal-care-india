import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAdminSession } from '@/lib/admin';
import { readReviewFile, reviewFileResponse } from '@/lib/documentReviews';
import { verifyReviewFileLink } from '@/lib/attachmentLinks';

export const dynamic = 'force-dynamic';

/**
 * GET /api/document-review/<id>/file — the uploaded document, for its client,
 * the lawyer it is assigned to, or an admin. Never cached, never public.
 *
 * `?e=<exp>&t=<sig>` — a signed link (serializeReview's `signedFileUrl`), for
 * the mobile app to open the file in the phone's viewer without its cookie.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  const query = new URL(request.url).searchParams;
  if (verifyReviewFileLink(id, query.get('e'), query.get('t'))) {
    const file = await readReviewFile(id, { admin: true });
    if (!file) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return reviewFileResponse(file);
  }
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
