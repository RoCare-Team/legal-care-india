import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { getSessionAdvocateId, clearAuthCookie } from '@/lib/auth';
import { getAdvocateById, ADVOCATES_TAG } from '@/lib/advocates';
import { normalizePlans } from '@/constants/consultationPlans';
import { slugify } from '@/utils/slugify';
import { geocodeAddress } from '@/lib/geocode';

/**
 * GET /api/dashboard/profile — the logged-in lawyer's full profile.
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
    services, subServices, languages, courts, practiceCities, barCouncil, experience,
    cases, clients, successRate,
    education, certificates, awards, timing,
    officeName, officeAddress, pincode,
    phone, whatsapp, email, fee, social, consultationPlans, videoPlans,
  } = body || {};

  const update = {};
  if (fullName !== undefined) {
    update.name = String(fullName).trim();
    // Keep the SEO slug in sync with the name (the legalCareId stays the same,
    // so the canonical URL just gets a fresher slug — old URLs 308-redirect).
    const nextSlug = slugify(update.name);
    if (nextSlug) update.slug = nextSlug;
  }
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
  if (Array.isArray(subServices)) update.subSpecializations = subServices;
  if (Array.isArray(languages)) update.languages = languages;
  const cleanList = (arr) => [...new Set(arr.map((s) => String(s || '').trim()).filter(Boolean))];
  if (Array.isArray(courts)) update.courts = cleanList(courts);
  if (Array.isArray(practiceCities)) update.practiceCities = cleanList(practiceCities);
  if (barCouncil !== undefined) update.barCouncilNumber = barCouncil;
  if (experience !== undefined) update.experience = Number(experience) || 0;
  if (cases !== undefined) update['metrics.cases'] = Number(cases) || 0;
  if (clients !== undefined) update['metrics.clients'] = Number(clients) || 0;
  if (successRate !== undefined) {
    update['metrics.successRate'] = Math.min(100, Math.max(0, Number(successRate) || 0));
  }
  if (Array.isArray(education)) update.education = education;
  if (Array.isArray(certificates)) update.certificates = certificates;
  if (Array.isArray(awards)) update.awards = awards;
  if (Array.isArray(timing)) update.timing = timing;
  if (fee !== undefined) update.consultationFee = Number(fee) || 0;

  // Live-chat plans: the lawyer's own duration + price rows (validated,
  // deduped by duration and sorted shortest-first).
  if (Array.isArray(consultationPlans)) {
    update.consultationPlans = normalizePlans(consultationPlans);
  }
  // Video-call plans — same shape, priced separately.
  if (Array.isArray(videoPlans)) {
    update.videoPlans = normalizePlans(videoPlans);
  }

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

  // If any address part changed, re-geocode the office so the "near me" filter
  // stays accurate. We fill missing pieces from the current record.
  const locationTouched =
    officeAddress !== undefined || pincode !== undefined ||
    city !== undefined || state !== undefined;

  try {
    await connectDB();

    if (locationTouched) {
      const current = await Advocate.findById(id).select('office city state').lean();
      const loc = await geocodeAddress({
        address: officeAddress !== undefined ? officeAddress : current?.office?.address,
        pincode: pincode !== undefined ? pincode : current?.office?.pincode,
        city: city !== undefined ? city : current?.city,
        state: state !== undefined ? state : current?.state,
      });
      if (loc) {
        update['office.location.lat'] = loc.lat;
        update['office.location.lng'] = loc.lng;
      }
    }

    await Advocate.findByIdAndUpdate(id, { $set: update }, { runValidators: true });
    // Public profile/listing changed — refresh the cached directory.
    revalidateTag(ADVOCATES_TAG);
    const advocate = await getAdvocateById(id);
    return NextResponse.json({ ok: true, advocate });
  } catch (err) {
    console.error('profile update error', err);
    return NextResponse.json({ error: 'Could not save changes. Please try again.' }, { status: 500 });
  }
}

/**
 * PATCH /api/dashboard/profile — quick partial updates from the dashboard,
 * currently just the online/offline availability switch.
 */
export async function PATCH(request) {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof body?.available !== 'boolean') {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  try {
    await connectDB();
    await Advocate.findByIdAndUpdate(id, { $set: { available: body.available } });
    // Presence shows on the public listing/profile — refresh the cached directory.
    revalidateTag(ADVOCATES_TAG);
    return NextResponse.json({ ok: true, available: body.available });
  } catch (err) {
    console.error('availability update error', err);
    return NextResponse.json({ error: 'Could not update availability.' }, { status: 500 });
  }
}

/**
 * DELETE /api/dashboard/profile — permanently deletes the logged-in lawyer's
 * account, removes them from the public directory and clears the session.
 */
export async function DELETE() {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  try {
    await connectDB();
    const deleted = await Advocate.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }
    // Lawyer removed from the public listing — refresh the cached directory.
    revalidateTag(ADVOCATES_TAG);

    // Sign the user out by clearing the session cookie.
    const res = NextResponse.json({ ok: true });
    return clearAuthCookie(res);
  } catch (err) {
    console.error('account delete error', err);
    return NextResponse.json(
      { error: 'Could not delete your account. Please try again.' },
      { status: 500 }
    );
  }
}
