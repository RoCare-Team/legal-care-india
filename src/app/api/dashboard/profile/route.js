import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById } from '@/lib/advocates';

/**
 * GET /api/dashboard/profile — the logged-in advocate's full profile.
 */
export async function GET() {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const advocate = await getAdvocateById(id);
  if (!advocate) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  return NextResponse.json({ advocate });
}

/**
 * PUT /api/dashboard/profile — save edits from the dashboard form.
 * Only profile fields are writable; login email, slug and password are not
 * touched here.
 */
export async function PUT(request) {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const {
    fullName, photo, coverImage, gallery, tagline, city, state, about,
    services, languages, barCouncil, experience,
    education, certificates, awards, timing,
    officeName, officeAddress, pincode,
    phone, whatsapp, email, fee, social,
  } = body || {};

  const update = {};
  if (fullName !== undefined) update.name = String(fullName).trim();
  if (photo !== undefined) update.photo = photo;
  if (coverImage !== undefined) update.coverImage = coverImage;
  if (Array.isArray(gallery)) {
    update.gallery = gallery
      .filter((g) => g && g.url)
      .map((g) => ({ url: g.url, label: g.label || '' }));
  }
  if (tagline !== undefined) update.tagline = tagline;
  if (city !== undefined) update.city = city;
  if (state !== undefined) update.state = state;
  if (about !== undefined) update.about = about;
  if (Array.isArray(services)) update.specializations = services;
  if (Array.isArray(languages)) update.languages = languages;
  if (barCouncil !== undefined) update.barCouncilNumber = barCouncil;
  if (experience !== undefined) update.experience = Number(experience) || 0;
  if (Array.isArray(education)) update.education = education;
  if (Array.isArray(certificates)) update.certificates = certificates;
  if (Array.isArray(awards)) update.awards = awards;
  if (Array.isArray(timing)) update.timing = timing;
  if (fee !== undefined) update.consultationFee = Number(fee) || 0;

  if (officeName !== undefined) update['office.name'] = officeName;
  if (officeAddress !== undefined) update['office.address'] = officeAddress;
  if (pincode !== undefined) update['office.pincode'] = pincode;

  if (phone !== undefined) update['contact.phone'] = phone;
  if (whatsapp !== undefined) update['contact.whatsapp'] = whatsapp;
  if (email !== undefined) update['contact.email'] = email;

  if (social && typeof social === 'object') {
    if (social.linkedin !== undefined) update['social.linkedin'] = social.linkedin;
    if (social.website !== undefined) update['social.website'] = social.website;
    if (social.facebook !== undefined) update['social.facebook'] = social.facebook;
    if (social.twitter !== undefined) update['social.twitter'] = social.twitter;
  }

  try {
    await connectDB();
    await Advocate.findByIdAndUpdate(id, { $set: update }, { runValidators: true });
    const advocate = await getAdvocateById(id);
    return NextResponse.json({ ok: true, advocate });
  } catch (err) {
    console.error('profile update error', err);
    return NextResponse.json({ error: 'Could not save changes. Please try again.' }, { status: 500 });
  }
}
