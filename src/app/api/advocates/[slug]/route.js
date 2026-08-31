import { NextResponse } from 'next/server';
import { resolveAdvocateByParam } from '@/lib/advocates';

/**
 * GET /api/advocates/<param> — one lawyer's full public profile.
 *
 * `<param>` is whatever a profile link carries: the canonical
 * `manoj-sharma-jusld07`, a bare `JUSLD07`, or a pre-sequential
 * `manoj-sharma-lci-8kq9pm`. Resolution is `resolveAdvocateByParam`, the same
 * function /lawyers/[slug] uses, so a link shared from the website opens the
 * same lawyer in the app — including the old links people already have.
 *
 * The record is the one the public page renders: `buildAdvocateProfile` has
 * already run, so the reviews, rates, office and FAQs are the same objects the
 * website shows, and the account's credential is not among them.
 *
 * Sits beside [slug]/reviews/route.js, and beside the static `nearby` segment
 * — Next matches a literal path segment before a dynamic one, so /nearby still
 * reaches its own route rather than being read as a lawyer's id.
 */
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { slug } = await params;

  try {
    const advocate = await resolveAdvocateByParam(slug);
    // An unapproved profile is not public. Answering 404 rather than 403 is
    // deliberate: whether someone has applied is not the caller's business.
    if (!advocate || advocate.status !== 'published') {
      return NextResponse.json({ error: 'Lawyer not found.' }, { status: 404 });
    }
    return NextResponse.json({ advocate }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('GET /api/advocates/[slug]', err);
    return NextResponse.json({ error: 'Could not load this profile.' }, { status: 500 });
  }
}
