import { NextResponse } from 'next/server';
import { listServices, listServiceCategories } from '@/lib/legalServices';

/**
 * GET /api/marketplace/services?category=&q=&limit=
 *
 * The catalogue. Public — a client browses fixed-price services before there
 * is any reason to make them sign in, and demanding a login to see a price is
 * the fastest way to lose them.
 *
 * Categories come back alongside the list so the app can draw its filter row
 * from one request instead of two.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  try {
    const [services, categories] = await Promise.all([
      listServices({
        category: searchParams.get('category') || '',
        q: searchParams.get('q') || '',
        limit: searchParams.get('limit') || 100,
      }),
      listServiceCategories(),
    ]);

    return NextResponse.json({ services, categories });
  } catch (err) {
    console.error('legal services list error', err);
    return NextResponse.json(
      { error: 'Could not load services right now.' },
      { status: 500 }
    );
  }
}
