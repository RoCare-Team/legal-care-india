import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/db';
import Testimonial from '@/models/Testimonial';
import { TESTIMONIALS_TAG } from '@/lib/testimonials';

/**
 * POST /api/testimonials  { name, role, city, rating, text }
 * Adds a public review of the platform. Anyone can submit; basic validation
 * guards against junk input.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = String(body?.name || '').trim();
  const role = String(body?.role || '').trim();
  const city = String(body?.city || '').trim();
  const rating = Number(body?.rating);
  const text = String(body?.text || '').trim();

  if (name.length < 2) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Please select a rating between 1 and 5 stars.' }, { status: 400 });
  }
  if (text.length < 10) {
    return NextResponse.json({ error: 'Please write at least a sentence about your experience.' }, { status: 400 });
  }

  try {
    await connectDB();
    await Testimonial.create({
      name: name.slice(0, 60),
      role: role.slice(0, 60),
      city: city.slice(0, 60),
      rating,
      text: text.slice(0, 600),
    });

    // New testimonial — refresh the cached homepage list.
    revalidateTag(TESTIMONIALS_TAG);

    return NextResponse.json({ ok: true, message: 'Thanks! Your review has been posted.' });
  } catch (err) {
    console.error('add testimonial error', err);
    return NextResponse.json({ error: 'Could not post your review. Please try again.' }, { status: 500 });
  }
}
