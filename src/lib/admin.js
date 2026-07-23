import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import User from '@/models/User';
import Enquiry from '@/models/Enquiry';
import Testimonial from '@/models/Testimonial';
import Consultation from '@/models/Consultation';
import Activity from '@/models/Activity';

/**
 * Admin access + read-only data for the /admin panel.
 *
 * The admin logs in with dedicated credentials (ADMIN_EMAIL + ADMIN_PASSWORD
 * from the environment) — no user/lawyer account needed. On success a signed
 * httpOnly cookie is set and every /admin route checks it.
 */

/** Separate cookie so admin auth is independent of user/lawyer sessions. */
export const ADMIN_COOKIE = 'lci_admin';

/** Validate a login attempt against the ADMIN_EMAIL/ADMIN_PASSWORD env vars. */
export function verifyAdminCredentials(email, password) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!adminEmail || !adminPassword) return false;
  return String(email || '').trim().toLowerCase() === adminEmail && String(password || '') === adminPassword;
}

/**
 * The current admin session from the signed cookie, or null.
 * Returns `{ email, role: 'admin' }`.
 */
export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return { email: payload.email || '', role: 'admin' };
}

/* ── Read-only data for the panel ───────────────────────────────────────── */

function iso(v) {
  return v ? new Date(v).toISOString() : null;
}

/** Every lawyer (all statuses), newest first. */
export async function adminGetAdvocates() {
  await connectDB();
  const rows = await Advocate.find({})
    .sort({ createdAt: -1 })
    .select('name email phone city state legalCareId slug status verified specializations consultationFee experience createdAt')
    .lean();
  return rows.map((r) => ({
    id: String(r._id),
    name: r.name || '',
    email: r.email || '',
    phone: r.phone || '',
    city: r.city || '',
    state: r.state || '',
    legalCareId: r.legalCareId || '',
    slug: r.slug || '',
    status: r.status || 'published',
    verified: Boolean(r.verified),
    specializations: r.specializations || [],
    consultationFee: r.consultationFee || 0,
    experience: r.experience || 0,
    createdAt: iso(r.createdAt),
  }));
}

/** Every registered user (client), newest first. */
export async function adminGetUsers() {
  await connectDB();
  const rows = await User.find({})
    .sort({ createdAt: -1 })
    .select('name email phone city createdAt')
    .lean();
  return rows.map((r) => ({
    id: String(r._id),
    name: r.name || '',
    email: r.email || '',
    phone: r.phone || '',
    city: r.city || '',
    createdAt: iso(r.createdAt),
  }));
}

/** Map a lean Consultation doc into a compact history row for detail pages. */
function toConsultationRow(r) {
  return {
    id: String(r._id),
    userName: r.userName || 'Client',
    advocateName: r.advocateName || 'Lawyer',
    minutes: r.minutes || 0,
    price: r.price || 0,
    status: r.status || 'pending',
    charged: ['active', 'ended'].includes(r.status),
    messagesCount: (r.messages || []).length,
    createdAt: iso(r.createdAt),
  };
}

/** Map a wallet ledger sub-doc into a plain row. */
function toWalletRow(t) {
  return {
    id: String(t._id),
    type: t.type || 'credit',
    amount: t.amount || 0,
    note: t.note || '',
    createdAt: iso(t.createdAt),
  };
}

/**
 * Full detail for a single user (client) — profile, wallet ledger and their
 * complete consultation history. Returns null if the id is unknown.
 */
export async function adminGetUserById(id) {
  await connectDB();
  let user;
  try {
    user = await User.findById(id).lean();
  } catch {
    return null; // malformed ObjectId
  }
  if (!user) return null;

  const consultations = await Consultation.find({ userId: id })
    .sort({ createdAt: -1 })
    .select('userName advocateName minutes price status messages createdAt')
    .lean();

  const rows = consultations.map(toConsultationRow);
  return {
    id: String(user._id),
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    city: user.city || '',
    photo: user.photo || '',
    anonymous: Boolean(user.anonymous),
    walletBalance: user.walletBalance || 0,
    walletTransactions: (user.walletTransactions || []).map(toWalletRow).reverse(),
    createdAt: iso(user.createdAt),
    consultations: rows,
    stats: {
      total: rows.length,
      connected: rows.filter((r) => r.charged).length,
      spent: rows.filter((r) => r.charged).reduce((s, r) => s + r.price, 0),
    },
  };
}

/**
 * Full detail for a single lawyer — the entire profile, earnings wallet,
 * consultation history and the enquiries they've received. Null if unknown.
 */
export async function adminGetAdvocateById(id) {
  await connectDB();
  let adv;
  try {
    adv = await Advocate.findById(id).lean();
  } catch {
    return null;
  }
  if (!adv) return null;

  const [consultations, enquiries] = await Promise.all([
    Consultation.find({ advocateId: id })
      .sort({ createdAt: -1 })
      .select('userName advocateName minutes price status messages createdAt')
      .lean(),
    Enquiry.find({ advocateId: id }).sort({ createdAt: -1 }).lean(),
  ]);

  const rows = consultations.map(toConsultationRow);
  return {
    id: String(adv._id),
    name: adv.name || '',
    email: adv.email || '',
    phone: adv.phone || '',
    legalCareId: adv.legalCareId || '',
    slug: adv.slug || '',
    photo: adv.photo || '',
    city: adv.city || '',
    state: adv.state || '',
    status: adv.status || 'published',
    verified: Boolean(adv.verified),
    available: Boolean(adv.available),
    experience: adv.experience || 0,
    barCouncilNumber: adv.barCouncilNumber || '',
    tagline: adv.tagline || '',
    about: adv.about || '',
    specializations: adv.specializations || [],
    subSpecializations: adv.subSpecializations || [],
    languages: adv.languages || [],
    consultationFee: adv.consultationFee || 0,
    consultationPlans: (adv.consultationPlans || []).map((p) => ({ minutes: p.minutes, price: p.price })),
    office: {
      name: adv.office?.name || '',
      address: adv.office?.address || '',
      area: adv.office?.area || '',
      pincode: adv.office?.pincode || '',
    },
    contact: {
      phone: adv.contact?.phone || '',
      whatsapp: adv.contact?.whatsapp || '',
      email: adv.contact?.email || '',
    },
    social: {
      linkedin: adv.social?.linkedin || '',
      website: adv.social?.website || '',
      facebook: adv.social?.facebook || '',
      twitter: adv.social?.twitter || '',
    },
    education: (adv.education || []).map((e) => ({ degree: e.degree || '', institute: e.institute || '', year: e.year || '' })),
    certificates: (adv.certificates || []).map((c) => ({ title: c.title || '', issuer: c.issuer || c.org || '', year: c.year || '' })),
    awards: (adv.awards || []).map((c) => ({ title: c.title || '', issuer: c.issuer || c.org || '', year: c.year || '' })),
    rating: adv.rating || 0,
    reviews: adv.reviews || 0,
    metrics: {
      cases: adv.metrics?.cases || 0,
      clients: adv.metrics?.clients || 0,
      successRate: adv.metrics?.successRate || 0,
    },
    walletBalance: adv.walletBalance || 0,
    walletTransactions: (adv.walletTransactions || []).map(toWalletRow).reverse(),
    createdAt: iso(adv.createdAt),
    consultations: rows,
    enquiries: enquiries.map((e) => ({
      id: String(e._id),
      name: e.name || '',
      phone: e.phone || '',
      email: e.email || '',
      message: e.message || '',
      status: e.status || 'new',
      createdAt: iso(e.createdAt),
    })),
    stats: {
      totalConsultations: rows.length,
      connected: rows.filter((r) => r.charged).length,
      earned: rows.filter((r) => r.charged).reduce((s, r) => s + r.price, 0),
      enquiries: enquiries.length,
    },
  };
}

/** Every platform testimonial, newest first. */
export async function adminGetTestimonials() {
  await connectDB();
  const rows = await Testimonial.find({}).sort({ createdAt: -1 }).lean();
  return rows.map((r) => ({
    id: String(r._id),
    name: r.name || '',
    role: r.role || '',
    city: r.city || '',
    rating: r.rating || 0,
    text: r.text || '',
    createdAt: iso(r.createdAt),
  }));
}

/**
 * Every paid live-chat consultation, newest first. This is the actual paid
 * activity on the platform — who booked whom, for how long, what it cost, and
 * where the session ended up.
 */
export async function adminGetConsultations() {
  await connectDB();
  const rows = await Consultation.find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .select('userName advocateName minutes price status startedAt endedAt messages call createdAt')
    .lean();
  return rows.map((r) => ({
    id: String(r._id),
    userName: r.userName || 'Client',
    advocateName: r.advocateName || 'Lawyer',
    minutes: r.minutes || 0,
    price: r.price || 0,
    status: r.status || 'pending',
    // Only a connected session (accepted by the lawyer) actually cost money.
    charged: ['active', 'ended'].includes(r.status),
    messagesCount: (r.messages || []).length,
    // Latest video-call attempt on this session (see mapCall below).
    call: mapCall(r.call),
    startedAt: iso(r.startedAt),
    createdAt: iso(r.createdAt),
  }));
}

/** 24-char hex — anything else would make an `_id` query throw a CastError. */
const OBJECT_ID = /^[a-f\d]{24}$/i;

/**
 * Every phone call placed through the dialler, newest first — who called which
 * lawyer, and when.
 *
 * These are read back out of `Activity`, which is written when a call is
 * successfully handed to Smartflo. So this is a log of calls *placed*: a row
 * does not prove the lawyer picked up, and calls the dialler refused never
 * appear at all.
 */
export async function adminGetPhoneCalls() {
  await connectDB();
  const rows = await Activity.find({ type: 'call' })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  // Activity snapshots the lawyer but keeps only the caller's id, so the client
  // names come from one extra query rather than one lookup per row.
  const ids = [...new Set(rows.map((r) => String(r.userId || '')))].filter((id) => OBJECT_ID.test(id));
  const users = ids.length ? await User.find({ _id: { $in: ids } }).select('name phone').lean() : [];
  const byId = new Map(users.map((u) => [String(u._id), u]));

  return rows.map((r) => {
    const user = byId.get(String(r.userId || ''));
    return {
      id: String(r._id),
      userId: String(r.userId || ''),
      // A caller whose account has since been deleted still has their calls on
      // record; showing a blank cell would read as a bug.
      userName: user?.name || 'Deleted user',
      userPhone: user?.phone || '',
      advocateId: r.advocateId || '',
      advocateName: r.advocateName || 'Lawyer',
      advocatePhone: r.advocatePhone || '',
      advocateCity: r.advocateCity || '',
      advocateProfilePath: r.advocateProfilePath || '',
      createdAt: iso(r.createdAt),
    };
  });
}

/**
 * The video-call leg of a consultation, flattened for the admin screens.
 *
 * Only the *latest* attempt survives in the record — the signalling sub-document
 * is reused on every ring — so this is "the last call on this session", not a
 * history. Signalling payloads (SDP/ICE) are deliberately dropped: they are
 * useless to a human and can run to kilobytes.
 */
function mapCall(call) {
  const c = call || {};
  const status = c.status || 'idle';
  const connectedAt = c.connectedAt ? new Date(c.connectedAt) : null;
  const endedAt = c.endedAt ? new Date(c.endedAt) : null;

  // Seconds actually spent on video: connect → hang-up. A call still running
  // has no end yet, so it is measured against now.
  let durationSec = 0;
  if (connectedAt) {
    const until = endedAt || (status === 'active' ? new Date() : null);
    if (until) durationSec = Math.max(0, Math.round((until - connectedAt) / 1000));
  }

  return {
    status,
    // Did the two sides ever actually see each other on this session?
    connected: Boolean(connectedAt),
    // A ring that never got picked up (rejected, missed, or dropped first).
    attempted: status !== 'idle',
    endedReason: c.endedReason || '',
    endedBy: c.endedBy || '',
    ringingAt: iso(c.ringingAt),
    connectedAt: iso(c.connectedAt),
    endedAt: iso(c.endedAt),
    durationSec,
  };
}

/**
 * One consultation in full, including the entire chat transcript, for the
 * admin drill-down. Returns null if the id is unknown or malformed.
 *
 * Note this deliberately ignores `hiddenForUser` / `hiddenForAdvocate` — those
 * only clear the row from a participant's own list, not from the record.
 */
export async function adminGetConsultationById(id) {
  await connectDB();

  let r = null;
  try {
    r = await Consultation.findById(id).lean();
  } catch {
    return null; // malformed ObjectId
  }
  if (!r) return null;

  return {
    id: String(r._id),
    userId: r.userId ? String(r.userId) : '',
    userName: r.userName || 'Client',
    advocateId: r.advocateId ? String(r.advocateId) : '',
    advocateName: r.advocateName || 'Lawyer',
    minutes: r.minutes || 0,
    price: r.price || 0,
    status: r.status || 'pending',
    charged: ['active', 'ended'].includes(r.status),
    messages: (r.messages || []).map((m) => ({
      id: String(m._id),
      from: m.from === 'advocate' ? 'advocate' : 'user',
      text: m.text || '',
      at: iso(m.at),
    })),
    call: mapCall(r.call),
    hiddenForUser: Boolean(r.hiddenForUser),
    hiddenForAdvocate: Boolean(r.hiddenForAdvocate),
    startedAt: iso(r.startedAt),
    endsAt: iso(r.endsAt),
    endedAt: iso(r.endedAt),
    createdAt: iso(r.createdAt),
  };
}

/** Local YYYY-MM-DD key for bucketing by calendar day. */
function dayKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/** Percentage change from `prev` to `curr`, rounded (0 when there's no base). */
function growthPct(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

/**
 * Trend data for the overview dashboard — a daily series over the last N days
 * plus period-over-period growth (last half vs the half before it). Powers the
 * activity chart and the growth badges. Resilient to DB hiccups.
 *
 * @param {number} days  window length (default 14)
 */
export async function adminGetOverviewMetrics(days = 14) {
  const empty = {
    series: [],
    totals: { consultations: 0, revenue: 0, users: 0 },
    growth: { consultations: 0, revenue: 0, users: 0 },
  };

  try {
    await connectDB();

    // Start of the window: midnight, `days-1` days ago (so we get `days` buckets).
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const [consultations, users] = await Promise.all([
      Consultation.find({ createdAt: { $gte: start } }).select('price status createdAt').lean(),
      User.find({ createdAt: { $gte: start } }).select('createdAt').lean(),
    ]);

    // Build empty daily buckets first so gaps show as zero, not missing.
    const buckets = new Map();
    const order = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = dayKey(d);
      order.push(key);
      buckets.set(key, { date: key, consultations: 0, revenue: 0, users: 0 });
    }

    for (const c of consultations) {
      const b = buckets.get(dayKey(c.createdAt));
      if (!b) continue;
      b.consultations += 1;
      if (['active', 'ended'].includes(c.status)) b.revenue += c.price || 0;
    }
    for (const u of users) {
      const b = buckets.get(dayKey(u.createdAt));
      if (b) b.users += 1;
    }

    const series = order.map((k) => buckets.get(k));
    const totals = series.reduce(
      (acc, d) => ({
        consultations: acc.consultations + d.consultations,
        revenue: acc.revenue + d.revenue,
        users: acc.users + d.users,
      }),
      { consultations: 0, revenue: 0, users: 0 }
    );

    // Growth: sum of the recent half vs the prior half of the window.
    const half = Math.floor(days / 2);
    const prior = series.slice(0, days - half);
    const recent = series.slice(days - half);
    const sum = (arr, key) => arr.reduce((s, d) => s + d[key], 0);
    const growth = {
      consultations: growthPct(sum(recent, 'consultations'), sum(prior, 'consultations')),
      revenue: growthPct(sum(recent, 'revenue'), sum(prior, 'revenue')),
      users: growthPct(sum(recent, 'users'), sum(prior, 'users')),
    };

    return { series, totals, growth };
  } catch {
    return empty;
  }
}

/** Dashboard counts for the overview page (resilient to DB hiccups). */
export async function adminGetCounts() {
  try {
    await connectDB();

    // Midnight today (local) — anything created at/after this is "today".
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const since = { createdAt: { $gte: startOfToday } };

    const [
      advocates, users, testimonials, consultations,
      advocatesToday, usersToday, consultationsToday,
    ] = await Promise.all([
      Advocate.countDocuments({}),
      User.countDocuments({}),
      Testimonial.countDocuments({}),
      Consultation.countDocuments({}),
      Advocate.countDocuments(since),
      User.countDocuments(since),
      Consultation.countDocuments(since),
    ]);

    return {
      advocates, users, testimonials, consultations,
      today: { advocates: advocatesToday, users: usersToday, consultations: consultationsToday },
    };
  } catch {
    return {
      advocates: 0, users: 0, testimonials: 0, consultations: 0,
      today: { advocates: 0, users: 0, consultations: 0 },
    };
  }
}
