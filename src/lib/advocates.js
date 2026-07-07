import { ADVOCATES } from '@/data/advocates';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { slugify } from '@/utils/slugify';

/**
 * Advocate data-access layer.
 *
 * The homepage/listing only need the lean records in `src/data/advocates.js`.
 * The public profile needs a rich, fully-populated advocate. Rather than bloat
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

const BAR_COUNCILS = ['D', 'MAH', 'KAR', 'TG', 'TN', 'PB', 'UP', 'RJ', 'GJ', 'WB'];

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
  { title: 'Client Choice Award', org: 'Legal Care India', year: 2023 },
];

const CERTIFICATES_POOL = [
  { title: 'Certified Mediator', issuer: 'Indian Institute of Arbitration & Mediation', year: 2018 },
  { title: 'Advanced Advocacy Training', issuer: 'Bar Council of India', year: 2017 },
  { title: 'Certificate in Company Law', issuer: 'ICSI', year: 2016 },
];

const REVIEW_AUTHORS = ['Rahul V.', 'Sneha K.', 'Imran A.', 'Divya R.', 'Aakash M.', 'Fatima S.'];
const REVIEW_TEXTS = [
  'Extremely professional and approachable. Explained every step of my case clearly and got a favourable outcome.',
  'Very knowledgeable and responsive. I could reach out on WhatsApp whenever I had a doubt.',
  'Handled my matter with great patience and honesty about fees and timelines. Highly recommended.',
  'Deep expertise and a calm, reassuring approach. Made a stressful situation much easier.',
];

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
      a: `The standard consultation fee is ₹${a.consultationFee}. Fees for representation vary by the complexity of your ${service.toLowerCase()} matter.`,
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
 * Enrich a lean advocate record into a full public profile.
 * @param {object} a base advocate record
 */
export function buildAdvocateProfile(a) {
  const seed = hash(a.slug);
  const initials = a.name.replace(/^Adv\.?\s*/, '').charAt(0).toUpperCase();
  const digits = String(1000 + (seed % 8999));
  const area = pick(OFFICE_AREAS, seed);
  const phone = `+91 ${90000 + (seed % 9999)} ${String(10000 + (seed % 89999))}`;

  return {
    ...a,
    initials,
    coverImage: a.coverImage || '',
    barCouncilNumber:
      a.barCouncilNumber || `${pick(BAR_COUNCILS, seed)}/${digits}/${2005 + (seed % 15)}`,
    about:
      a.about ||
      `${a.name} is a ${a.verified ? 'verified ' : ''}advocate based in ${a.city}, ${a.state}, with over ${a.experience} years of experience in ${a.specializations?.join(', ') || 'multiple areas of law'}. Known for a client-first approach, ${a.name.split(' ')[1] || 'the advocate'} combines deep courtroom experience with clear, practical advice — helping individuals and businesses navigate complex legal matters with confidence.`,
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
      email: `${a.slug.replace(/-/g, '.')}@legalcareindia.com`,
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
    reviewsList:
      a.reviewsList ||
      Array.from({ length: 4 }, (_, i) => ({
        id: `${a.slug}-rev-${i}`,
        author: REVIEW_AUTHORS[(seed + i) % REVIEW_AUTHORS.length],
        rating: i === 0 ? 5 : 5 - (i % 2),
        date: ['2 weeks ago', '1 month ago', '3 months ago', '5 months ago'][i],
        text: REVIEW_TEXTS[(seed + i) % REVIEW_TEXTS.length],
      })),
    faqs: a.faqs || buildFaqs(a),
    metrics: a.metrics || {
      cases: 120 + (seed % 400),
      clients: 90 + (seed % 300),
      successRate: 88 + (seed % 11),
    },
  };
}

/** All lean advocate records. */
export async function getAllAdvocates() {
  try {
    await connectDB();
    const rows = await Advocate.find({ status: 'published' }).lean();
    if (rows?.length) return rows.map((r) => buildAdvocateProfile(serialize(r)));
  } catch (err) {
    console.warn('getAllAdvocates: MongoDB unavailable, falling back to static advocates', err);
  }
  return ADVOCATES;
}

/** Full profile for a single advocate slug, or null. */
export async function getAdvocateBySlug(slug) {
  try {
    await connectDB();
    const advocate = await Advocate.findOne({ slug }).lean();
    if (advocate) return buildAdvocateProfile(serialize(advocate));
  } catch (err) {
    console.warn('getAdvocateBySlug: MongoDB unavailable, falling back to static record', err);
  }

  const base = ADVOCATES.find((a) => a.slug === slug);
  return base ? buildAdvocateProfile(base) : null;
}

/** All advocate slugs for sitemap and static params. */
export async function getAllAdvocateSlugs() {
  try {
    await connectDB();
    const rows = await Advocate.find({ status: 'published' }).select('slug').lean();
    if (rows?.length) return rows.map((a) => a.slug);
  } catch (err) {
    console.warn('getAllAdvocateSlugs: MongoDB unavailable, falling back to static slugs', err);
  }
  return ADVOCATES.map((a) => a.slug);
}

/** Full profile for a single advocate id from MongoDB, or null. */
export async function getAdvocateById(id) {
  await connectDB();
  const advocate = await Advocate.findById(id).lean();
  return advocate ? buildAdvocateProfile(serialize(advocate)) : null;
}

/** Related advocates: same specialization or city, excluding the given one. */
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
