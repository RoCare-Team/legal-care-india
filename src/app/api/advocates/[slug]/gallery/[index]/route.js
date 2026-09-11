import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';

/**
 * GET /api/advocates/<id|JUSLDnn>/gallery/<index> — one office photo.
 *
 * The same reason as the profile photo route beside it: gallery pictures are
 * stored inline as base64, and a profile with a handful of them carried well
 * over a megabyte of image bytes inside its HTML — twice, once in the markup
 * and once in the data React hydrates from — before the page could show
 * anything. Served from here they load after the page, in parallel, and the
 * browser keeps them.
 *
 * Cached for a day rather than for good: a lawyer can replace the picture at
 * an index, and the URL does not change when they do.
 */

const CACHE = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';

/** Parse `data:image/jpeg;base64,…` into something that can be sent as-is. */
function decodeDataUri(value) {
  const match = /^data:([\w.+-]+\/[\w.+-]+);base64,(.*)$/s.exec(value || '');
  if (!match) return null;
  try {
    return { type: match[1], body: Buffer.from(match[2], 'base64') };
  } catch {
    return null;
  }
}

export async function GET(_request, { params }) {
  const { slug, index } = await params;
  const key = String(slug || '').trim();
  const i = Number(index);
  if (!key || !Number.isInteger(i) || i < 0) return new NextResponse(null, { status: 404 });

  try {
    await connectDB();

    const where = mongoose.Types.ObjectId.isValid(key)
      ? { _id: key }
      : { legalCareId: key.toUpperCase() };

    // Only the one element is read back, not the whole gallery.
    const row = await Advocate.findOne(where, { status: 1, gallery: { $slice: [i, 1] } }).lean();
    const url = row?.gallery?.[0]?.url;
    // An unapproved profile is not public, and neither are its pictures.
    if (!row || row.status !== 'published' || !url) {
      return new NextResponse(null, { status: 404 });
    }

    if (/^https?:\/\//i.test(url)) {
      return NextResponse.redirect(url, 307);
    }

    const image = decodeDataUri(url);
    if (!image) return new NextResponse(null, { status: 404 });

    return new NextResponse(image.body, {
      headers: {
        'Content-Type': image.type,
        'Content-Length': String(image.body.length),
        'Cache-Control': CACHE,
      },
    });
  } catch (err) {
    console.error('GET /api/advocates/[slug]/gallery/[index]', err);
    return new NextResponse(null, { status: 404 });
  }
}
