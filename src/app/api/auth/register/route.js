import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { ADVOCATES_TAG } from '@/lib/advocates';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { nextLegalCareId } from '@/lib/legalCareId';
import { advocateProfilePath } from '@/utils/advocateUrl';
import { slugify } from '@/utils/slugify';
import { normalizeRate } from '@/constants/callRates';
import { geocodeAddress } from '@/lib/geocode';

/** Trim + dedupe a raw string array, dropping empties. */
function cleanList(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((s) => String(s || '').trim()).filter(Boolean))];
}

/**
 * The registration photograph, or '' if it is not one we produced.
 *
 * The wizard downscales the file in the browser and posts a JPEG data URL, so
 * that is the only shape accepted here. Anything else — a remote URL, a
 * `javascript:` string, an oversized blob — is dropped rather than written to
 * the document and then rendered on every card that lawyer appears on.
 *
 * The cap is on the encoded length: 512px at the wizard's quality lands well
 * under 200KB, so a megabyte is generous and still bounds the document.
 */
const MAX_PHOTO_CHARS = 1_000_000;

function safePhoto(raw) {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return '';
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return '';
  return value.length <= MAX_PHOTO_CHARS ? value : '';
}

/** The gender values the schema accepts; anything else is stored as blank. */
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

/**
 * A Date from the wizard's 'YYYY-MM-DD', or null.
 *
 * An empty or malformed value must not become `new Date('')` — that is an
 * Invalid Date, which Mongoose rejects and which would fail the whole
 * registration over an optional field the advocate chose to skip.
 */
function safeDate(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}


/**
 * POST /api/auth/register
 * Creates a real lawyer account from the registration wizard, logs the
 * lawyer in (httpOnly cookie) and publishes their profile so it appears in
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
    photo,
    fullName, email, phone, password,
    gender, dob, pincode,
    barCouncil, enrollmentDate,
    designation, chamberName, practiceMode,
    experience, city, state,
    courts = [], practiceCities = [],
    services = [], subServices = [], languages = [],
    officeName, officeAddress, officeTiming, fee, tagline, about,
    practiceFromResidence, residenceAddress, residencePincode,
    chatRate, audioRate, videoRate,
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

    // The wizard flags a duplicate mobile as it is typed; this is the check
    // that actually decides, since the field is not unique at the schema level
    // and two people could reach here with the same number at once.
    const last10 = phone.replace(/\D/g, '').slice(-10);
    if (
      await Advocate.exists({
        $or: [
          { phone: new RegExp(`${last10}$`) },
          { 'contact.phone': new RegExp(`${last10}$`) },
        ],
      })
    ) {
      return NextResponse.json(
        { error: 'An account with this mobile number already exists. Please log in.' },
        { status: 409 }
      );
    }

    // SEO slug (need not be unique — the Justiceland ID disambiguates).
    const slug = slugify(fullName) || 'advocate';
    // Permanent, unique public identifier.
    const legalCareId = await nextLegalCareId();

    const passwordHash = await hashPassword(password);
    const digits = phone.replace(/[^0-9]/g, '');

    // Geocode the office so the lawyer shows up in the "near me" distance
    // filter. Best-effort — if OpenStreetMap can't resolve it, we save nulls and
    // the lawyer can refine their address later from the dashboard.
    const location = await geocodeAddress({ address: officeAddress, city, state });

    const advocate = await Advocate.create({
      email: normalizedEmail,
      passwordHash,
      name: fullName.trim(),
      // Optional, and only ever the data URL the wizard produced — anything
      // that is not one is dropped rather than trusted into the document.
      photo: safePhoto(photo),
      slug,
      legalCareId,
      phone: phone.trim(),
      city: city || '',
      state: state || '',
      experience: Number(experience) || 0,
      barCouncilNumber: barCouncil || '',
      tagline: tagline || '',
      about: about || '',

      // Optional detail from the redesigned wizard. Dates arrive as the
      // 'YYYY-MM-DD' an <input type="date"> produces; an unparseable or empty
      // one is stored as null rather than an Invalid Date, which Mongoose would
      // otherwise reject and take the whole registration down with it.
      gender: GENDERS.includes(gender) ? gender : '',
      dob: safeDate(dob),
      pincode: /^[1-9][0-9]{5}$/.test(String(pincode || '')) ? String(pincode) : '',
      enrollmentDate: safeDate(enrollmentDate),
      designation: String(designation || '').trim().slice(0, 80),
      chamberName: String(chamberName || '').trim().slice(0, 140),
      practiceMode: String(practiceMode || '').trim().slice(0, 60),
      specializations: Array.isArray(services) ? services : [],
      subSpecializations: Array.isArray(subServices) ? subServices : [],
      languages: Array.isArray(languages) ? languages : [],
      courts: cleanList(courts),
      // Base city is always part of the cities the lawyer serves.
      practiceCities: cleanList([city, ...(Array.isArray(practiceCities) ? practiceCities : [])]),
      consultationFee: Number(fee) || 0,
      // Per-minute rates, one per live channel. A rate that is blank or out of
      // bounds becomes 0, which simply means that channel is not on offer.
      chatRate: normalizeRate(chatRate),
      audioRate: normalizeRate(audioRate),
      videoRate: normalizeRate(videoRate),
      office: {
        name: officeName || '',
        address: officeAddress || '',
        pincode: /^[1-9][0-9]{5}$/.test(String(pincode || '')) ? String(pincode) : '',
        location: location || { lat: null, lng: null },
      },
      // Only stored when the advocate actually turned the toggle on — an
      // address left behind by a toggle since switched off is not one they
      // are offering to be visited at.
      residence: practiceFromResidence
        ? {
          practises: true,
          address: String(residenceAddress || '').trim(),
          pincode: /^[1-9][0-9]{5}$/.test(String(residencePincode || '')) ? String(residencePincode) : '',
        }
        : { practises: false, address: '', pincode: '' },
      // The wizard asks for opening hours as one line ("Mon – Sat, 10 AM – 7 PM")
      // rather than a row per weekday, which would be six more fields on an
      // already long form. It is stored as a single entry the dashboard can
      // later split into days if the advocate wants that detail.
      timing: String(officeTiming || '').trim()
        ? [{ day: 'All days', hours: String(officeTiming).trim().slice(0, 120), open: true }]
        : [],
      contact: { phone: phone.trim(), whatsapp: digits, email: normalizedEmail },
      // New registrations wait for admin approval before going public.
      status: 'pending',
    });

    // Refresh the cached directory (the profile stays hidden until approved, but
    // keeping the tag fresh avoids serving a stale list once it is approved).
    revalidateTag(ADVOCATES_TAG);

    const token = signToken({ id: String(advocate._id), role: 'advocate' });
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
