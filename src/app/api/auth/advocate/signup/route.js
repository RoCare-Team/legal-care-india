import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { ADVOCATES_TAG } from '@/lib/advocates';
import { signToken, setAuthCookie } from '@/lib/auth';
import { nextLegalCareId } from '@/lib/legalCareId';
import { slugify } from '@/utils/slugify';
import { CITIES } from '@/data/cities';
import { SIGNUP_COOKIE, readSignupToken, clearSignupCookie } from '@/lib/advocateOtp';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The state a city sits in, when we know the city. Blank is fine. */
function stateFor(city) {
  const wanted = String(city || '').trim().toLowerCase();
  return CITIES.find((c) => c.name.toLowerCase() === wanted)?.state || '';
}

/**
 * POST /api/auth/advocate/signup  { name, email, city }
 *
 * Creates a lawyer's account from the three things asked after the code is
 * confirmed, and signs them in.
 *
 * The phone number is NOT taken from the body. It comes from the httpOnly
 * proof set by the verify route, so this endpoint can only ever create an
 * account for a number that answered a code in this browser, minutes ago.
 *
 * Everything else a profile eventually needs — practice areas, cities, slot
 * prices, photograph — is left for the dashboard. That is the whole point of
 * the split: the account has to exist before a plan can attach to it, and a
 * plan has to attach before there is anything meaningful to say about how many
 * practice areas a lawyer may list.
 */
export async function POST(request) {
  const store = await cookies();
  const phone = readSignupToken(store.get(SIGNUP_COOKIE)?.value);
  if (!phone) {
    return NextResponse.json(
      { error: 'expired', message: 'That took a while — please verify your number again.' },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();
  const city = String(body?.city || '').trim();

  if (name.length < 2) {
    return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (!city) {
    return NextResponse.json({ error: 'Please choose the city you practise in.' }, { status: 400 });
  }

  try {
    await connectDB();

    // Checked before the insert so the common case gets a sentence that says
    // what to do, rather than the duplicate-key error caught below.
    if (await Advocate.exists({ email })) {
      return NextResponse.json(
        {
          error: 'email-taken',
          message: 'That email is already on another account. Try a different one.',
        },
        { status: 409 }
      );
    }
    // The number could have been registered between the code and this request.
    if (await Advocate.exists({ phoneNormalized: phone })) {
      return NextResponse.json(
        {
          error: 'phone-taken',
          message: 'This number already has an account. Please sign in.',
        },
        { status: 409 }
      );
    }

    const advocate = await Advocate.create({
      name,
      email,
      phone,
      phoneNormalized: phone,
      city,
      state: stateFor(city),
      slug: slugify(name) || 'advocate',
      legalCareId: await nextLegalCareId(),
      // The city they practise from is always one of the cities they serve.
      practiceCities: [city],
      contact: { phone, whatsapp: phone, email },
      // No password is set. Signing in is a code to this number, and an empty
      // hash cannot be matched by anything.
      passwordHash: '',
      // Same as before: a new profile is reviewed before it goes public.
      status: 'pending',
    });

    revalidateTag(ADVOCATES_TAG);

    const token = signToken({ id: String(advocate._id), role: 'advocate' });
    const res = NextResponse.json(
      {
        ok: true,
        advocate: {
          id: String(advocate._id),
          name: advocate.name,
          legalCareId: advocate.legalCareId,
        },
        // Into the guided setup, not the dashboard. The account exists but the
        // profile is four fields deep; dropping a new lawyer on a dashboard
        // full of zeroes and asking them to find the editor is where this
        // used to end. The setup hands them to the dashboard when it is done.
        redirect: '/setup?new=1',
      },
      { status: 201 }
    );
    // The proof has done its job; leaving it set would let a second account be
    // started from the same verification.
    clearSignupCookie(res);
    return setAuthCookie(res, token);
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err?.keyPattern || {})[0] || 'email';
      return NextResponse.json(
        {
          error: 'duplicate',
          message:
            field === 'phoneNormalized'
              ? 'This number already has an account. Please sign in.'
              : 'That email is already on another account. Try a different one.',
        },
        { status: 409 }
      );
    }
    console.error('advocate signup error', err);
    return NextResponse.json(
      {
        error: 'Something went wrong. Please try again.',
        // Development only. A stack or a schema message tells an attacker
        // about the shape of the data; it tells a developer what broke.
        ...(process.env.NODE_ENV === 'development'
          ? { detail: String(err?.message || err) }
          : {}),
      },
      { status: 500 }
    );
  }
}
