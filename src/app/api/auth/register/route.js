import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { slugify } from '@/utils/slugify';

/**
 * POST /api/auth/register
 * Creates a real advocate account from the registration wizard, logs the
 * advocate in (httpOnly cookie) and publishes their profile so it appears in
 * the public directory immediately.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const {
    fullName, email, phone, password,
    barCouncil, experience, city, state,
    services = [], languages = [],
    officeName, officeAddress, fee, tagline, about,
  } = body || {};

  // Server-side validation (mirrors the wizard so the API can't be bypassed).
  if (!fullName?.trim()) return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if ((phone || '').replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Enter a valid 10-digit mobile number.' }, { status: 400 });
  }
  if ((password || '').length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  try {
    await connectDB();

    const normalizedEmail = email.trim().toLowerCase();
    if (await Advocate.findOne({ email: normalizedEmail })) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    // Build a unique, URL-safe slug from the advocate's name.
    const base = slugify(fullName) || 'advocate';
    let slug = base;
    let n = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await Advocate.findOne({ slug })) {
      n += 1;
      slug = `${base}-${n}`;
    }

    const passwordHash = await hashPassword(password);
    const digits = phone.replace(/[^0-9]/g, '');

    const advocate = await Advocate.create({
      email: normalizedEmail,
      passwordHash,
      name: fullName.trim(),
      slug,
      phone: phone.trim(),
      city: city || '',
      state: state || '',
      experience: Number(experience) || 0,
      barCouncilNumber: barCouncil || '',
      tagline: tagline || '',
      about: about || '',
      specializations: Array.isArray(services) ? services : [],
      languages: Array.isArray(languages) ? languages : [],
      consultationFee: Number(fee) || 0,
      office: { name: officeName || '', address: officeAddress || '' },
      contact: { phone: phone.trim(), whatsapp: digits, email: normalizedEmail },
      status: 'published',
    });

    const token = signToken({ id: String(advocate._id) });
    const res = NextResponse.json(
      { ok: true, advocate: { id: String(advocate._id), slug: advocate.slug, name: advocate.name } },
      { status: 201 }
    );
    return setAuthCookie(res, token);
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }
    console.error('register error', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
