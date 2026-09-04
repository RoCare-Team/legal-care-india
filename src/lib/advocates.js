import { unstable_cache } from 'next/cache';
import { ADVOCATES } from '@/data/advocates';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { slugify } from '@/utils/slugify';
import { advocateProfilePath, parseAdvocateParam } from '@/utils/advocateUrl';

/**
 * Public lawyer reads are cached and tagged so pages can render statically
 * (ISR) instead of hitting MongoDB on every request. The cache is invalidated
 * the moment a lawyer registers or edits their profile via
 * `revalidateTag(ADVOCATES_TAG)`, so new records still appear immediately.
 */
export const ADVOCATES_TAG = 'advocates';
const CACHE_TTL = 3600; // seconds — safety refresh; writes invalidate sooner

/**
 * Lawyer data-access layer.
 *
 * The homepage/listing only need the lean records in `src/data/advocates.js`.
 * The public profile needs a rich, fully-populated lawyer. Rather than bloat
 * the source data with dozens of fields per record, we derive the extended
 * profile deterministically here (stable across renders — no Math.random),
 * merging any real overrides present on the base record.
 *
 * Swap this module for real API calls later; components stay untouched.
 */

/**
 * Convert a Mongoose lean document into a plain, JSON-safe object.
 * `.lean()` still leaves non-plain values (ObjectId, Buffer, Date) that
 * Next.js refuses to pass from a Server to a Client Component. Round-tripping
 * through JSON turns ObjectId → string, Date → ISO string, etc.
 */
function serialize(doc) {
  return JSON.parse(JSON.stringify(doc));
}

/** Deterministic small integer from a string — keeps SSR/CSR output stable. */
function hash(value = '') {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Pick a stable element from `list` based on `seed`. */
function pick(list, seed) {
  return list[seed % list.length];
}


const OFFICE_AREAS = [
  'Connaught Place', 'Bandra West', 'MG Road', 'Banjara Hills', 'T. Nagar',
  'Civil Lines', 'Sector 17', 'C-Scheme', 'Salt Lake', 'Gomti Nagar',
];

const EDUCATION_POOL = [
  { degree: 'LL.M. (Constitutional Law)', institute: 'National Law School of India University', year: 2012 },
  { degree: 'LL.B.', institute: 'Faculty of Law, University of Delhi', year: 2009 },
  { degree: 'B.A. LL.B. (Hons.)', institute: 'NALSAR University of Law', year: 2010 },
  { degree: 'LL.M. (Corporate Law)', institute: 'Government Law College, Mumbai', year: 2013 },
  { degree: 'Diploma in Cyber Law', institute: 'Asian School of Cyber Laws', year: 2015 },
];

const AWARDS_POOL = [
  { title: 'Best Advocate of the Year', org: 'District Bar Association', year: 2022 },
  { title: 'Pro Bono Excellence Award', org: 'State Legal Services Authority', year: 2021 },
  { title: 'Young Achiever in Law', org: 'Legal Era Awards', year: 2019 },
  { title: 'Client Choice Award', org: 'Justiceland', year: 2023 },
];

const CERTIFICATES_POOL = [
  { title: 'Certified Mediator', issuer: 'Indian Institute of Arbitration & Mediation', year: 2018 },
  { title: 'Advanced Advocacy Training', issuer: 'Bar Council of India', year: 2017 },
  { title: 'Certificate in Company Law', issuer: 'ICSI', year: 2016 },
];

/** Human-friendly "time ago" label from an ISO date string. */
function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [name, size] of units) {
    const n = Math.floor(secs / size);
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

/** Build the fixed FAQ block, lightly personalised. */
function buildFaqs(a) {
  const service = a.specializations?.[0] || 'legal';
  return [
    {
      q: `What types of cases does ${a.name} handle?`,
      a: `${a.name} primarily handles ${a.specializations?.join(', ') || 'a range of legal'} matters, with ${a.experience}+ years of courtroom and advisory experience.`,
    },
    {
      q: 'How can I book a consultation?',
      a: 'You can call, message on WhatsApp, or email directly using the contact options on this profile. Online booking is coming soon.',
    },
    {
      q: 'What is the consultation fee?',
      // A lawyer who has not set a fee has no figure to quote. "₹0" read as a
      // free consultation — on the profile and, worse, inside the FAQ structured
      // data this page hands to search engines.
      a: a.consultationFee > 0
        ? `The standard consultation fee is ₹${Number(a.consultationFee).toLocaleString('en-IN')}. Fees for representation vary by the complexity of your ${service.toLowerCase()} matter.`
        : `${a.name} has not published a standard consultation fee. Ask directly using the contact options on this profile — fees for representation vary by the complexity of your ${service.toLowerCase()} matter.`,
    },
    {
      q: 'Which languages can I communicate in?',
      a: `${a.name} can consult in ${a.languages?.join(', ') || 'English'}.`,
    },
  ];
}

/** Deterministic office timings. */
const OFFICE_TIMING = [
  { day: 'Monday – Friday', hours: '10:00 AM – 7:00 PM', open: true },
  { day: 'Saturday', hours: '10:00 AM – 3:00 PM', open: true },
  { day: 'Sunday', hours: 'By appointment', open: false },
];

/**
 * Enrich a lean lawyer record into a full public profile.
 * @param {object} a base lawyer record
 */
export function buildAdvocateProfile(a) {
  // The account's own credential never leaves this function. Everything built
  // here is handed to client components and to /api/advocates/nearby, so a
  // field spread through `...a` below ends up in public HTML — and a bcrypt
  // hash published beside the name it belongs to is an offline attack anyone
  // can run at their leisure. Nothing needs it here: the login route reads the
  // Advocate document straight from Mongo.
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, ...rest } = a;
  a = rest;

  const seed = hash(a.slug);
  const initials = a.name.replace(/^Adv\.?\s*/, '').charAt(0).toUpperCase();
  const area = pick(OFFICE_AREAS, seed);
  const phone = `+91 ${90000 + (seed % 9999)} ${String(10000 + (seed % 89999))}`;

  // Real client reviews (newest first) + derived aggregate rating.
  const reviewsList = (a.reviewsList || [])
    .filter((r) => r && r.text && r.rating)
    .map((r) => ({
      id: r._id || r.id,
      author: r.author,
      rating: r.rating,
      text: r.text,
      date: timeAgo(r.createdAt),
      createdAt: r.createdAt,
    }))
    .sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));
  const reviewsCount = reviewsList.length;
  const avgRating = reviewsCount
    ? Math.round((reviewsList.reduce((s, r) => s + r.rating, 0) / reviewsCount) * 10) / 10
    : 0;

  return {
    ...a,
    legalCareId: a.legalCareId || '',
    profilePath: advocateProfilePath(a),
    // Manual availability switch (defaults to offline for older records).
    available: Boolean(a.available),
    // Note: there is deliberately no server-rendered `online` here. These reads
    // are ISR-cached, so any "reachable right now" computed at this point is
    // frozen into the cache and would keep showing a stale green badge for the
    // whole cache window. Live status comes from /api/presence via
    // PresenceProvider, which is the only source the badges trust.
    // Per-minute rates per live channel (0 ⇒ that channel is not offered).
    chatRate: a.chatRate || 0,
    audioRate: a.audioRate || 0,
    videoRate: a.videoRate || 0,
    // The fixed plans these replaced, still carried so a lawyer who hasn't
    // saved a rate yet is priced from their old ones rather than reading ₹0.
    consultationPlans: a.consultationPlans || [],
    // Video-call rates, priced separately (empty ⇒ video not offered).
    videoPlans: a.videoPlans || [],
    // Audio-call rates, priced separately (empty ⇒ audio calls not offered).
    audioPlans: a.audioPlans || [],
    rating: avgRating,
    reviews: reviewsCount,
    reviewsList,
    initials,
    coverImage: a.coverImage || '',
    // Never invented. A bar council number is a real credential a visitor may
    // check against the roll, so an advocate who has not supplied one shows
    // nothing rather than a plausible-looking string.
    barCouncilNumber: a.barCouncilNumber || '',
    about:
      a.about ||
      `${a.name} is a ${a.verified ? 'verified ' : ''}lawyer based in ${a.city}, ${a.state}, with over ${a.experience} years of experience in ${a.specializations?.join(', ') || 'multiple areas of law'}. Known for a client-first approach, ${a.name.split(' ')[1] || 'the lawyer'} combines deep courtroom experience with clear, practical advice — helping individuals and businesses navigate complex legal matters with confidence.`,
    legalServices: (a.specializations || []).map((name) => ({
      name,
      slug: slugify(name),
    })),
    office: a.office || {
      name: `${a.name.replace(/^Adv\.?\s*/, '').split(' ')[0]} Legal Chambers`,
      area,
      address: `${100 + (seed % 400)}, ${area}, ${a.city}, ${a.state}`,
      pincode: String(110000 + (seed % 800000)),
      mapQuery: `${area}, ${a.city}, ${a.state}`,
    },
    timing: a.timing || OFFICE_TIMING,
    contact: a.contact || {
      phone,
      whatsapp: phone.replace(/[^0-9]/g, ''),
      email: `${a.slug.replace(/-/g, '.')}@justiceland.online`,
    },
    social: a.social || {
      linkedin: `https://linkedin.com/in/${a.slug}`,
      website: `https://${a.slug}.example.in`,
    },
    education: a.education || [pick(EDUCATION_POOL, seed), pick(EDUCATION_POOL, seed + 3)],
    certificates: a.certificates || [pick(CERTIFICATES_POOL, seed), pick(CERTIFICATES_POOL, seed + 1)],
    awards: a.awards || [pick(AWARDS_POOL, seed), pick(AWARDS_POOL, seed + 2)],
    gallery:
      a.gallery ||
      Array.from({ length: 6 }, (_, i) => ({
        id: `${a.slug}-img-${i}`,
        label: ['Reception', 'Meeting Room', 'Library', 'Cabin', 'Waiting Area', 'Entrance'][i],
      })),
    faqs: a.faqs || buildFaqs(a),
    // Real practice highlights entered by the lawyer (0 when not provided).
    metrics: {
      cases: a.metrics?.cases || 0,
      clients: a.metrics?.clients || 0,
      successRate: a.metrics?.successRate || 0,
    },
  };
}

/**
 * The cached readers below deliberately DO NOT swallow DB errors: if the read
 * throws (e.g. MongoDB is temporarily unreachable), unstable_cache does not
 * cache anything and rethrows. The thin public wrappers catch that and return
 * the static fallback WITHOUT caching it — so once the DB recovers, the very
 * next request fetches fresh data instead of serving a stale empty list.
 * A successful-but-empty result is still cached (it's a real "no lawyers").
 */
/**
 * The URL a lawyer's photograph is served from.
 *
 * The list hands out this path instead of the image itself — see below for why.
 * Same-origin, so it needs no entry in next.config's remotePatterns, and it is
 * stable per lawyer so a browser caches it once and never asks again.
 */
export function advocatePhotoUrl(id) {
  return `/api/advocates/${String(id)}/photo`;
}

/**
 * Every published lawyer, for the directory and the home page bands.
 *
 * The three image fields are deliberately left in the database. Photographs are
 * stored inline as base64 data URIs, and across the published set they are
 * 21.8 MB of the collection's 22.3 MB — `gallery` alone is 8.6 MB, `photo` 8.0,
 * `coverImage` 5.2. Reading them all to render a list of names was survivable
 * at twenty lawyers and fatal at 286: each request pulled 22 MB, `serialize`
 * copied it, `buildAdvocateProfile` spread it twice more, and the cache
 * serialised the result again — a few hundred megabytes per call, for pages
 * that show a 68-pixel avatar. Every route that called this stopped answering
 * at all.
 *
 * Excluding them takes the read from 22.3 MB to about half a megabyte. The
 * avatar is not lost: `photo` comes back as the URL of a route that serves that
 * one lawyer's image, which the browser then caches per lawyer rather than
 * re-downloading inside every list payload.
 *
 * Single-lawyer reads below are untouched and still return the stored image —
 * the lawyer's own edit form round-trips that value back on save, and handing
 * it a URL would overwrite the photograph with a link to itself.
 */
const _getAllAdvocates = unstable_cache(
  async () => {
    await connectDB();
    const rows = await Advocate.aggregate([
      { $match: { status: 'published' } },
      // Newest registrations first, so a freshly registered lawyer shows up
      // at the start of the directory and the featured slider.
      { $sort: { createdAt: -1 } },
      // Whether there is a photograph, without reading it: a lawyer with none
      // must come back with an empty `photo` so the card falls back to their
      // initials rather than pointing at an image that 404s.
      {
        $addFields: {
          hasPhoto: { $gt: [{ $strLenBytes: { $ifNull: ['$photo', ''] } }, 0] },
        },
      },
      { $project: { photo: 0, coverImage: 0, gallery: 0, passwordHash: 0 } },
    ]);

    return rows.map((r) => {
      const profile = buildAdvocateProfile(serialize(r));
      profile.photo = r.hasPhoto ? advocatePhotoUrl(r._id) : '';
      return profile;
    });
  },
  ['all-advocates'],
  { revalidate: CACHE_TTL, tags: [ADVOCATES_TAG] }
);

/** All lean lawyer records (falls back to static data if the DB is down). */
export async function getAllAdvocates() {
  try {
    return await _getAllAdvocates();
  } catch (err) {
    console.warn('getAllAdvocates: MongoDB unavailable, falling back to static advocates', err);
    return ADVOCATES;
  }
}

const _getAdvocateBySlug = unstable_cache(
  async (slug) => {
    await connectDB();
    const advocate = await Advocate.findOne({ slug }).lean();
    return advocate ? buildAdvocateProfile(serialize(advocate)) : null;
  },
  ['advocate-by-slug'],
  { revalidate: CACHE_TTL, tags: [ADVOCATES_TAG] }
);

/**
 * Full profile for a legacy slug lookup, or null. Only used to redirect old
 * slug-only URLs — the primary key is now the Justiceland ID.
 */
export async function getAdvocateBySlug(slug) {
  try {
    return await _getAdvocateBySlug(slug);
  } catch (err) {
    console.warn('getAdvocateBySlug: MongoDB unavailable, falling back to static record', err);
    const base = ADVOCATES.find((a) => a.slug === slug);
    return base ? buildAdvocateProfile(base) : null;
  }
}

const _getAdvocateByLegalCareId = unstable_cache(
  async (legalCareId) => {
    await connectDB();
    const advocate = await Advocate.findOne({ legalCareId }).lean();
    return advocate ? buildAdvocateProfile(serialize(advocate)) : null;
  },
  ['advocate-by-lci'],
  { revalidate: CACHE_TTL, tags: [ADVOCATES_TAG] }
);

/** Full profile for a permanent Justiceland ID, or null. */
export async function getAdvocateByLegalCareId(legalCareId) {
  try {
    return await _getAdvocateByLegalCareId(legalCareId);
  } catch (err) {
    console.warn('getAdvocateByLegalCareId: MongoDB unavailable', err);
    const base = ADVOCATES.find((a) => a.legalCareId === legalCareId);
    return base ? buildAdvocateProfile(base) : null;
  }
}

/**
 * Resolve a lawyer from a public `[slug]` route param.
 *
 * The param can be any of the three shapes a profile link has ever had — the
 * canonical `manoj-sharma-jusld07`, a bare `JUSLD07`, or a pre-sequential
 * `manoj-sharma-lci-8kq9pm` — because all three are indexed and shared, and a
 * link that used to work should keep working.
 *
 * Resolution is not the same thing as permission: an unpublished profile
 * resolves here so the caller can tell "no such lawyer" apart from "not
 * approved yet". Both the public page and GET /api/advocates/<param> then
 * refuse anything that is not published, and the page additionally redirects a
 * non-canonical param to the canonical one.
 *
 * @param {string} param
 * @returns {Promise<object|null>}
 */
export async function resolveAdvocateByParam(param) {
  const value = String(param || '');
  const { legalCareId, legacyLegalCareId } = parseAdvocateParam(value);
  if (legalCareId) return getAdvocateByLegalCareId(legalCareId);
  if (legacyLegalCareId) return getAdvocateByLegacyId(legacyLegalCareId);
  // A bare Justiceland ID — how the app addresses a lawyer it already holds a
  // record for — then a slug-only URL from before the ids existed at all.
  return (
    (await getAdvocateByLegalCareId(value.toUpperCase())) ||
    (await getAdvocateBySlug(value))
  );
}

const _getAdvocateByLegacyId = unstable_cache(
  async (legacyLegalCareId) => {
    await connectDB();
    const advocate = await Advocate.findOne({ legacyLegalCareId }).lean();
    return advocate ? buildAdvocateProfile(serialize(advocate)) : null;
  },
  ['advocate-by-legacy-lci'],
  { revalidate: CACHE_TTL, tags: [ADVOCATES_TAG] }
);

/**
 * Full profile for a retired `LCI-XXXXXX` id, or null.
 *
 * Only reached by URLs that were shared or indexed before the sequential
 * scheme. The caller redirects to the profile's current address.
 */
export async function getAdvocateByLegacyId(legacyLegalCareId) {
  try {
    return await _getAdvocateByLegacyId(legacyLegalCareId);
  } catch (err) {
    console.warn('getAdvocateByLegacyId: MongoDB unavailable', err);
    return null;
  }
}

const _getAllAdvocateParams = unstable_cache(
  async () => {
    await connectDB();
    const rows = await Advocate.find({ status: 'published' })
      .select('slug legalCareId')
      .lean();
    return rows.map((a) => advocateProfilePath(a));
  },
  ['all-advocate-params'],
  { revalidate: CACHE_TTL, tags: [ADVOCATES_TAG] }
);

/** Canonical profile path segments (`slug-lci-id`) for sitemap + static params. */
export async function getAllAdvocateParams() {
  try {
    return await _getAllAdvocateParams();
  } catch (err) {
    console.warn('getAllAdvocateParams: MongoDB unavailable, falling back to static', err);
    return ADVOCATES.map((a) => advocateProfilePath(a));
  }
}

/** Full profile for a single lawyer id from MongoDB, or null. */
export async function getAdvocateById(id) {
  await connectDB();
  const advocate = await Advocate.findById(id).lean();
  return advocate ? buildAdvocateProfile(serialize(advocate)) : null;
}

/** Related lawyers: same specialization or city, excluding the given one. */
export function getRelatedAdvocates(advocate, limit = 3) {
  const specs = new Set(advocate.specializations || []);
  return ADVOCATES.filter((a) => a.slug !== advocate.slug)
    .map((a) => {
      const sharesSpec = (a.specializations || []).some((s) => specs.has(s));
      const sameCity = a.city === advocate.city;
      return { a, score: (sharesSpec ? 2 : 0) + (sameCity ? 1 : 0) };
    })
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.a);
}
