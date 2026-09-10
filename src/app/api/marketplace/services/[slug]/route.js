import { NextResponse } from 'next/server';
import { getServiceBySlug } from '@/lib/legalServices';

/**
 * GET /api/marketplace/services/[slug] — one service, with everything the detail
 * screen shows: the long description, what is included, the documents the
 * client will need, and the numbered steps.
 *
 * Public, for the same reason the list is.
 */
export async function GET(request, { params }) {
  const { slug } = await params;

  try {
    const service = await getServiceBySlug(slug);
    if (!service) {
      return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    }
    return NextResponse.json({ service });
  } catch (err) {
    console.error('legal service detail error', err);
    return NextResponse.json(
      { error: 'Could not load this service right now.' },
      { status: 500 }
    );
  }
}
