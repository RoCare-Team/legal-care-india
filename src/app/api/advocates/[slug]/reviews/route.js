import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { ADVOCATES_TAG } from '@/lib/advocates';

/**
 * POST /api/advocates/[slug]/reviews  { author, rating, text }
 * Adds a public client review to an advocate and recomputes their aggregate
 * rating. Anyone can submit; basic validation guards against junk input.
 */
export async function POST(request, { params }) {
  const { slug } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const author = String(body?.author || '').trim();
  const rating = Number(body?.rating);
  const text = String(body?.text || '').trim();

  if (author.length < 2) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Please select a rating between 1 and 5 stars.' }, { status: 400 });
  }
  if (text.length < 5) {
    return NextResponse.json({ error: 'Please write a short review (at least 5 characters).' }, { status: 400 });
  }

  try {
    await connectDB();
    const advocate = await Advocate.findOne({ slug });
    if (!advocate) {
      return NextResponse.json({ error: 'Advocate not found.' }, { status: 404 });
    }

    advocate.reviewsList.push({
      author: author.slice(0, 60),
      rating,
      text: text.slice(0, 1000),
      createdAt: new Date(),
    });

    // Recompute the aggregate rating + count from all reviews.
    const list = advocate.reviewsList;
    advocate.reviews = list.length;
    advocate.rating =
      Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10;

    await advocate.save();

    // Public profile changed — refresh the cached directory/profile.
    revalidateTag(ADVOCATES_TAG);

    return NextResponse.json({ ok: true, message: 'Thanks! Your review has been posted.' });
  } catch (err) {
    console.error('add review error', err);
    return NextResponse.json({ error: 'Could not post your review. Please try again.' }, { status: 500 });
  }
}
