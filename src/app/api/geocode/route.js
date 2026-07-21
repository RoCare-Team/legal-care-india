import { NextResponse } from 'next/server';
import { geocodeQuery } from '@/lib/geocode';

/**
 * GET /api/geocode?pincode=110001   (or ?q=Connaught Place, Delhi)
 *
 * Resolves a user-supplied pincode / place into { lat, lng } so the directory
 * can offer a distance filter when the browser's geolocation is unavailable or
 * denied. Runs server-side so the OpenStreetMap User-Agent policy is honoured.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pincode = (searchParams.get('pincode') || '').trim();
  const q = (searchParams.get('q') || '').trim();

  if (pincode && !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: 'Enter a valid 6-digit pincode.' }, { status: 400 });
  }

  const query = pincode ? `${pincode}, India` : q;
  if (!query) {
    return NextResponse.json({ error: 'Provide a pincode or place.' }, { status: 400 });
  }

  const loc = await geocodeQuery(query);
  if (!loc) {
    return NextResponse.json({ error: 'Could not find that location.' }, { status: 404 });
  }

  return NextResponse.json(loc);
}
