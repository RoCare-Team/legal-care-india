import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';

/**
 * GET /api/advocates/<id|JUSLDnn>/photo — one lawyer's photograph.
 *
 * Photographs are stored inline in the lawyer's document as base64 data URIs.
 * That is fine for one lawyer and ruinous for a list of them: the directory
 * read used to carry 8 MB of photographs (and another 13.8 MB of galleries and
 * cover images) on every request, which is why it stopped answering once the
 * directory passed a couple of hundred lawyers. The list now hands out this
 * path instead, and the image travels once per lawyer, cached by the browser,
 * rather than inside every payload that mentions them.
 *
 * Only the `photo` field is read, so this stays a small query however large the
 * rest of the document has grown.
 */

/** A year, and the bytes never change for a given URL until the photo does. */
const CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable';

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
  const { slug } = await params;
  const key = String(slug || '').trim();
  if (!key) return new NextResponse(null, { status: 404 });

  try {
    await connectDB();

    // The list addresses lawyers by _id; a hand-typed or shared link may use
    // the Justiceland ID instead, and both should reach the same picture.
    const where = mongoose.Types.ObjectId.isValid(key)
      ? { _id: key }
      : { legalCareId: key.toUpperCase() };

    const row = await Advocate.findOne(where).select('photo status').lean();
    // An unapproved profile is not public, and neither is its photograph.
    if (!row || row.status !== 'published' || !row.photo) {
      return new NextResponse(null, { status: 404 });
    }

    // A photo uploaded through /api/admin/upload is already a URL somewhere
    // else; send the caller there rather than proxying bytes we do not hold.
    if (/^https?:\/\//i.test(row.photo)) {
      return NextResponse.redirect(row.photo, 308);
    }

    const image = decodeDataUri(row.photo);
    if (!image) return new NextResponse(null, { status: 404 });

    return new NextResponse(image.body, {
      headers: {
        'Content-Type': image.type,
        'Content-Length': String(image.body.length),
        'Cache-Control': CACHE,
      },
    });
  } catch (err) {
    console.error('GET /api/advocates/[slug]/photo', err);
    // A missing picture is a card with initials on it, not a broken page.
    return new NextResponse(null, { status: 404 });
  }
}
