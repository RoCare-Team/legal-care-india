import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { suggestLawyers } from '@/lib/documentReviews';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/document-reviews/lawyers?area=property&q=sharma
 * Lawyers to give a review to — matched to the document's area, or searched.
 */
export async function GET(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const lawyers = await suggestLawyers({
    area: searchParams.get('area') || 'other',
    q: searchParams.get('q') || '',
  });
  return NextResponse.json({ lawyers });
}
