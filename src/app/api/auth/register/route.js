import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { ADVOCATES_TAG } from '@/lib/advocates';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { generateLegalCareId } from '@/lib/legalCareId';
import { advocateProfilePath } from '@/utils/advocateUrl';
import { slugify } from '@/utils/slugify';

/** Generate a Legal Care India ID that isn't already taken (retries on clash). */
async function uniqueLegalCareId() {
  for (let i = 0; i < 12; i += 1) {
    const id = generateLegalCareId();
    // eslint-disable-next-line no-await-in-loop
    if (!(await Advocate.exists({ legalCareId: id }))) return id;
  }
  throw new Error('Could not generate a unique Legal Care India ID');
}

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

    // SEO slug (need not be unique — the Legal Care India ID disambiguates).
    const slug = slugify(fullName) || 'advocate';
    // Permanent, unique public identifier.
    const legalCareId = await uniqueLegalCareId();

    const passwordHash = await hashPassword(password);
    const digits = phone.replace(/[^0-9]/g, '');

    const advocate = await Advocate.create({
      email: normalizedEmail,
      passwordHash,
      name: fullName.trim(),
      slug,
      legalCareId,
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

    // New public advocate — drop the cached directory so it appears at once.
    revalidateTag(ADVOCATES_TAG);

    const token = signToken({ id: String(advocate._id) });
    const res = NextResponse.json(
      {
        ok: true,
        advocate: {
          id: String(advocate._id),
          slug: advocate.slug,
          legalCareId: advocate.legalCareId,
          profilePath: advocateProfilePath(advocate),
          name: advocate.name,
        },
      },
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
