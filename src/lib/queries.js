import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import LegalQuery from '@/models/LegalQuery';
import { normalizePhone } from '@/lib/loginOtp';
import { getQueryCredits, spendQueryCredit, refundQueryCredit } from '@/lib/queryCredits';

/**
 * Public legal queries: posted by anyone without an account, worked by
 * whichever lawyer takes them first.
 *
 * Two rules hold this together and both are enforced in the database rather
 * than in the UI:
 *
 *   a query is claimed exactly once — the claim is a conditional update, so
 *   two lawyers pressing at the same moment cannot both get it;
 *
 *   contact details leave the server only for the lawyer holding the claim —
 *   every row in the open pool goes through `openShape`, which reduces the
 *   name to a first name and the phone to its last four digits.
 */

/** Longest message we keep; enough for a real problem, not an essay. */
const MAX_MESSAGE = 1500;
const MIN_MESSAGE = 20;

/** What one visitor may post, so the pool cannot be flooded. */
const RATE = {
  perIpPerHour: 5,
  perPhonePerDay: 3,
};

function httpError(message, status = 400, code = '') {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  return e;
}

/** The IP is only ever stored as a hash, keyed to this deployment's secret. */
function hashIp(ip) {
  const value = String(ip || '').trim();
  if (!value) return '';
  return crypto
    .createHash('sha256')
    .update(`${value}:${process.env.JWT_SECRET || 'lci'}`)
    .digest('hex')
    .slice(0, 32);
}

/** "9876543210" → "•••••• 3210", for the list nobody has claimed yet. */
function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 4 ? `•••••• ${digits.slice(-4)}` : '••••••';
}

/** "Rahul Sharma" → "Rahul S." — enough to address them, not to find them. */
function shortName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Client';
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

function timeAgo(value) {
  if (!value) return '';
  const secs = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [name, size] of units) {
    const n = Math.floor(secs / size);
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

/** The open pool's shape: the matter, never the person. */
function openShape(row) {
  return {
    id: String(row._id),
    category: row.category || '',
    city: row.city || '',
    message: row.message,
    askedBy: shortName(row.name),
    phoneMasked: maskPhone(row.phone),
    hasEmail: Boolean(row.email),
    createdAt: row.createdAt,
    age: timeAgo(row.createdAt),
    status: row.status,
  };
}

/** The claimed shape: everything the lawyer needs to actually reach them. */
function claimedShape(row) {
  return {
    ...openShape(row),
    name: row.name,
    phone: row.phone,
    email: row.email || '',
    claimedAt: row.claimedAt,
    claimedAge: timeAgo(row.claimedAt),
    resolvedAt: row.resolvedAt,
    resolutionNote: row.resolutionNote || '',
  };
}

// ── Posting ──────────────────────────────────────────────────────────────────

/**
 * Records a query from the public form.
 *
 * @param {object} input  { name, phone, email?, category?, city?, message, website? }
 * @param {object} meta   { ip, userAgent, userId }
 */
export async function createQuery(input, meta = {}) {
  // Honeypot: a real person never fills a field they cannot see. Answered as
  // success so a bot has nothing to learn from the difference.
  if (String(input?.website || '').trim()) {
    return { ok: true, id: '' };
  }

  const name = String(input?.name || '').trim().replace(/\s+/g, ' ');
  const phone = normalizePhone(input?.phone);
  const email = String(input?.email || '').trim().toLowerCase();
  const category = String(input?.category || '').trim().slice(0, 60);
  const city = String(input?.city || '').trim().slice(0, 60);
  const message = String(input?.message || '').trim();

  if (name.length < 2 || name.length > 80) throw httpError('Please enter your name.');
  if (!phone) throw httpError('Enter a valid 10-digit Indian mobile number.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw httpError('That email address does not look right.');
  if (message.length < MIN_MESSAGE) {
    throw httpError(`Describe your problem in a little more detail (at least ${MIN_MESSAGE} characters).`);
  }

  await connectDB();

  const ipHash = hashIp(meta.ip);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (ipHash) {
    const recent = await LegalQuery.countDocuments({ ipHash, createdAt: { $gte: hourAgo } });
    if (recent >= RATE.perIpPerHour) {
      throw httpError('You have posted several questions already. Please try again in an hour.', 429);
    }
  }
  const byPhone = await LegalQuery.countDocuments({ phone, createdAt: { $gte: dayAgo } });
  if (byPhone >= RATE.perPhonePerDay) {
    throw httpError('This number has posted a few questions today. A lawyer will reach you on the earlier ones.', 429);
  }

  const created = await LegalQuery.create({
    name: name.slice(0, 80),
    phone,
    email: email.slice(0, 120),
    category,
    city,
    message: message.slice(0, MAX_MESSAGE),
    userId: meta.userId || '',
    ipHash,
    userAgent: String(meta.userAgent || '').slice(0, 200),
  });

  return { ok: true, id: String(created._id) };
}

// ── The lawyer's side ────────────────────────────────────────────────────────

/**
 * What the lawyer's Client Queries page shows: the open pool (no contact
 * details), the ones they are working on, and the ones they finished.
 *
 * The open pool is only for a plan that carries query credits. Without one the
 * lawyer gets the count — so they know what they are missing — and nothing
 * else: not the problems, not the cities, not the practice areas.
 */
export async function getQueriesForAdvocate(advocateId, { category = '', city = '' } = {}) {
  await connectDB();
  const id = new mongoose.Types.ObjectId(String(advocateId));

  const openFilter = { status: 'open' };
  if (category) openFilter.category = category;
  if (city) openFilter.city = new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

  const credits = await getQueryCredits(advocateId);
  const locked = !credits.hasPlan;

  const [open, mine, resolved, openTotal, categories] = await Promise.all([
    // `openShape` is what keeps the pool anonymous: the name comes back as
    // "Rahul S." and the phone as its last four digits, and the raw values
    // never reach the response.
    locked
      ? []
      : LegalQuery.find(openFilter)
        .select('category city message createdAt status name phone email')
        .sort({ createdAt: -1 })
        .limit(60)
        .lean(),
    LegalQuery.find({ claimedBy: id, status: 'claimed' }).sort({ claimedAt: -1 }).limit(60).lean(),
    LegalQuery.find({ claimedBy: id, status: 'resolved' }).sort({ resolvedAt: -1 }).limit(60).lean(),
    LegalQuery.countDocuments({ status: 'open' }),
    locked ? [] : LegalQuery.distinct('category', { status: 'open' }),
  ]);

  return {
    open: open.map(openShape),
    mine: mine.map(claimedShape),
    resolved: resolved.map(claimedShape),
    openTotal,
    categories: categories.filter(Boolean).sort(),
    locked,
    credits,
  };
}

/** How many questions are waiting for somebody to take them. */
export async function countOpenQueries() {
  try {
    await connectDB();
    return await LegalQuery.countDocuments({ status: 'open' });
  } catch (err) {
    console.warn('countOpenQueries: MongoDB unavailable', err);
    return 0;
  }
}

/**
 * Takes a query out of the pool for one lawyer, for one query credit.
 *
 * The status check lives in the update, so the second lawyer to press gets a
 * plain "someone else took it" rather than a duplicate lead — the whole point
 * of a shared pool is that a client is not called by five lawyers at once.
 *
 * The credit is spent before the claim, so there is no moment where a lawyer
 * holds a query they have not paid for; if the claim then loses the race, the
 * credit goes straight back. Releasing a query later does not refund it — by
 * then the lawyer has had the client's number.
 */
export async function claimQuery(queryId, advocate) {
  if (!mongoose.isValidObjectId(queryId)) throw httpError('That question no longer exists.', 404);
  await connectDB();

  // Cheap check first, so pressing on a query that is already gone does not
  // touch the lawyer's credits at all.
  const current = await LegalQuery.findById(queryId).select('status').lean();
  if (!current) throw httpError('That question no longer exists.', 404);
  if (current.status !== 'open') throw httpError('Another lawyer just picked this up.', 409, 'taken');

  const { cycle } = await spendQueryCredit(advocate.id);

  let claimed;
  try {
    claimed = await LegalQuery.findOneAndUpdate(
      { _id: queryId, status: 'open' },
      {
        $set: {
          status: 'claimed',
          claimedBy: advocate.id,
          claimedByName: advocate.name || '',
          claimedAt: new Date(),
          creditCycle: cycle,
        },
      },
      { new: true }
    ).lean();
  } catch (err) {
    // The database failed after the credit was taken; the lawyer got nothing.
    await refundQueryCredit(advocate.id, cycle).catch(() => {});
    throw err;
  }

  if (!claimed) {
    await refundQueryCredit(advocate.id, cycle);
    const exists = await LegalQuery.findById(queryId).select('status').lean();
    if (exists && exists.status !== 'open') {
      throw httpError('Another lawyer just picked this up.', 409, 'taken');
    }
    throw httpError('That question no longer exists.', 404);
  }
  return claimedShape(claimed);
}

/** Puts it back in the pool for someone else. */
export async function releaseQuery(queryId, advocateId) {
  if (!mongoose.isValidObjectId(queryId)) throw httpError('That question no longer exists.', 404);
  await connectDB();
  const released = await LegalQuery.findOneAndUpdate(
    { _id: queryId, status: 'claimed', claimedBy: advocateId },
    { $set: { status: 'open', claimedBy: null, claimedByName: '', claimedAt: null } },
    { new: true }
  ).lean();
  if (!released) throw httpError('This question is not yours to release.', 409);
  return openShape(released);
}

/** Done with. It leaves the pool for good — no lawyer sees it again. */
export async function resolveQuery(queryId, advocateId, note = '') {
  if (!mongoose.isValidObjectId(queryId)) throw httpError('That question no longer exists.', 404);
  await connectDB();
  const resolved = await LegalQuery.findOneAndUpdate(
    { _id: queryId, status: 'claimed', claimedBy: advocateId },
    {
      $set: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolutionNote: String(note || '').trim().slice(0, 500),
      },
    },
    { new: true }
  ).lean();
  if (!resolved) throw httpError('This question is not yours to close.', 409);
  return claimedShape(resolved);
}
