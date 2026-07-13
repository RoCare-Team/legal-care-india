import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import City from '@/models/City';
import { CITIES_TAG } from '@/lib/cities';
import { CITIES as STATIC_CITIES } from '@/data/cities';
import { slugify } from '@/utils/slugify';

/** Drop the cached city list and re-render the pages that show cities. */
function revalidateCities() {
  revalidateTag(CITIES_TAG);
  revalidatePath('/');
  revalidatePath('/cities');
}

/**
 * POST /api/admin/cities  { name, state, advocates, image }
 * Admin-only. Adds a new city that gets its own /cities/[slug] page.
 */
export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = String(body?.name || '').trim();
  const state = String(body?.state || '').trim();
  const advocates = Math.max(0, Math.round(Number(body?.advocates) || 0));
  const image = String(body?.image || '').trim();

  if (name.length < 2) {
    return NextResponse.json({ error: 'Please enter the city name.' }, { status: 400 });
  }
  if (state.length < 2) {
    return NextResponse.json({ error: 'Please enter the state.' }, { status: 400 });
  }

  const slug = slugify(name);
  if (!slug) {
    return NextResponse.json({ error: 'Could not build a URL from that name.' }, { status: 400 });
  }

  // Guard against clashing with a built-in city.
  if (STATIC_CITIES.some((c) => c.slug === slug)) {
    return NextResponse.json({ error: 'That city already exists on the site.' }, { status: 409 });
  }

  try {
    await connectDB();
    if (await City.exists({ slug })) {
      return NextResponse.json({ error: 'That city has already been added.' }, { status: 409 });
    }

    await City.create({ slug, name, state, advocates, image });
    revalidateCities();

    return NextResponse.json({ ok: true, slug, message: `${name} added.` });
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'That city has already been added.' }, { status: 409 });
    }
    console.error('add city error', err);
    return NextResponse.json({ error: 'Could not add the city. Please try again.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/cities?slug=xyz — remove an admin-added city.
 * (Built-in cities live in code and can't be deleted here.)
 */
export async function DELETE(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing city.' }, { status: 400 });

  try {
    await connectDB();
    const res = await City.deleteOne({ slug });
    if (res.deletedCount === 0) {
      return NextResponse.json({ error: 'City not found (built-in cities can\'t be removed).' }, { status: 404 });
    }
    revalidateCities();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('delete city error', err);
    return NextResponse.json({ error: 'Could not delete the city.' }, { status: 500 });
  }
}
