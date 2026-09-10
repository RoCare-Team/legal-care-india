import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { getSessionAdvocateId, clearAuthCookie } from '@/lib/auth';
import { getAdvocateById, ADVOCATES_TAG } from '@/lib/advocates';
import { normalizeRate } from '@/constants/callRates';
import {
  CONSULTATION_SLOTS, CONSULTATION_CHANNELS, normalizeSlotPrice, slotKey,
} from '@/constants/consultationSlots';
import { activePlan, checkPlanLimits } from '@/constants/membershipPlans';
import { slugify } from '@/utils/slugify';
import { geocodeAddress } from '@/lib/geocode';

/**
 * The lawyer's own slot prices, as a Map keyed by minutes.
 *
 * Only the slots we actually offer, and only real figures — a blank or junk
 * entry is dropped rather than stored as 0, because 0 and "not set" have to
 * stay distinguishable: an unset slot falls back to the platform default.
 */
function slotPriceMap(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const out = {};

  const take = (key) => {
    const price = normalizeSlotPrice(raw[key] ?? raw[String(key)]);
    if (price > 0) out[String(key)] = price;
  };

  for (const slot of CONSULTATION_SLOTS) {
    // The shared price, kept because every account created before channels
    // existed has one and it is still the fallback for any channel left blank.
    take(slot.minutes);
    // And one per channel. Built from our own lists rather than from whatever
    // keys the body happened to carry, so a request cannot invent a channel or
    // a slot length and have it stored.
    for (const channel of CONSULTATION_CHANNELS) take(slotKey(channel.key, slot.minutes));
  }

  return Object.keys(out).length ? out : undefined;
}

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
    cases, casesWon, clients,
    education, certificates, awards, timing,
    officeName, officeAddress, pincode,
    phone, whatsapp, email, fee, social, chatRate, audioRate, videoRate, slotPrices,
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
  // Not rejected when blank. The headline is required — it carries a `*` and
  // the completion meter counts it, and a profile is only reviewed for the
  // directory once complete — but the setup wizard saves one step at a time
  // while sending the whole profile, so a blank headline arrives with the
  // cities step. Rejecting it there stops the save on a screen that has no
  // headline field to fix it on.
  if (tagline !== undefined) update.tagline = String(tagline).trim();
  if (city !== undefined) update.city = city;
  if (state !== undefined) update.state = state;
  if (about !== undefined) update.about = about;
  // How much of their practice this lawyer may list is decided by their
  // membership, and it is decided here rather than only in the form. The form
  // stops at the limit and offers an upgrade, which is the right experience —
  // but the form is a page anyone can edit, and this route is the only place
  // that actually holds the line.
  /** Trim + dedupe a raw string array, dropping empties. */
  const cleanList = (arr) => [...new Set(arr.map((s) => String(s || '').trim()).filter(Boolean))];

  if (Array.isArray(services) || Array.isArray(subServices) || Array.isArray(practiceCities)) {
    const current = await Advocate.findById(id)
      .select('specializations subSpecializations practiceCities city planId planExpiresAt')
      .lean();
    if (!current) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const areas = Array.isArray(services) ? services : current.specializations || [];
    const matters = Array.isArray(subServices)
      ? subServices
      : current.subSpecializations || [];
    const allCities = Array.isArray(practiceCities)
      ? cleanList(practiceCities)
      : current.practiceCities || [];

    // The lawyer's own city is where they are, not a city they chose to add,
    // so it never counts against the allowance. Otherwise a free plan of two
    // would really be one, and the number in the pricing table would be wrong.
    const base = String(city ?? current.city ?? '').trim().toLowerCase();
    const extraCities = allCities.filter((c) => String(c).trim().toLowerCase() !== base);

    const plan = activePlan(current);
    const check = checkPlanLimits(plan, { areas, matters, cities: extraCities });
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error, upgradeTo: check.upgradeTo, plan: plan.id },
        { status: 402 }
      );
    }

    if (Array.isArray(services)) update.specializations = services;
    if (Array.isArray(subServices)) update.subSpecializations = subServices;
  }
  if (Array.isArray(languages)) update.languages = languages;
  if (Array.isArray(courts)) update.courts = cleanList(courts);
  if (Array.isArray(practiceCities)) update.practiceCities = cleanList(practiceCities);
  if (barCouncil !== undefined) update.barCouncilNumber = barCouncil;
  if (experience !== undefined) update.experience = Number(experience) || 0;
  if (cases !== undefined) update['metrics.cases'] = Number(cases) || 0;
  if (casesWon !== undefined) update['metrics.casesWon'] = Number(casesWon) || 0;
  if (clients !== undefined) update['metrics.clients'] = Number(clients) || 0;

  // The success rate is worked out here, from the two counts, and never
  // taken from the request. It is a claim clients choose a lawyer on, so it
  // has to follow from figures rather than be a third number a browser can
  // name — the form shows it read-only for the same reason.
  if (cases !== undefined || casesWon !== undefined) {
    const handled = Number(update['metrics.cases'] ?? NaN);
    const won = Number(update['metrics.casesWon'] ?? NaN);
    if (Number.isFinite(handled) && handled > 0 && Number.isFinite(won)) {
      update['metrics.successRate'] = Math.min(100, Math.max(0, Math.round((won / handled) * 100)));
    }
  }
  if (Array.isArray(education)) update.education = education;
  if (Array.isArray(certificates)) update.certificates = certificates;
  if (Array.isArray(awards)) update.awards = awards;
  if (Array.isArray(timing)) update.timing = timing;
  if (fee !== undefined) update.consultationFee = Number(fee) || 0;

  // Per-minute rates, one per live channel. Anything blank or out of bounds
  // normalizes to 0, which is how a lawyer says they don't offer that channel.
  //
  // Saving a rate also clears that channel's legacy fixed plans: they are only
  // read as a fallback, and leaving them behind would let a stale package
  // outlive the rate that replaced it.
  // Sent whole or not at all: the form always posts all three, so a partial
  // object means a slot was cleared and should fall back to the default rather
  // than keep an old figure the lawyer has just deleted.
  if (slotPrices !== undefined) update.slotPrices = slotPriceMap(slotPrices);

  if (chatRate !== undefined) {
    update.chatRate = normalizeRate(chatRate);
    update.consultationPlans = [];
  }
  if (audioRate !== undefined) {
    update.audioRate = normalizeRate(audioRate);
    update.audioPlans = [];
  }
  if (videoRate !== undefined) {
    update.videoRate = normalizeRate(videoRate);
    update.videoPlans = [];
  }

  if (officeName !== undefined) update['office.name'] = String(officeName).trim();
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
