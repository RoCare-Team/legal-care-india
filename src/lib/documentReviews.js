import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import DocumentReview from '@/models/DocumentReview';
import Advocate from '@/models/Advocate';
import User from '@/models/User';
import { sniff } from '@/lib/verificationDocuments';
import { applyLegacyCommission } from '@/lib/payouts';
import { splitEarning } from '@/constants/payouts';
import { reviewDocument } from '@/lib/ai/documentReview';
import {
  AI_REVIEW_FEE, AI_MAX_PAGES, REVIEW_MAX_BYTES, REVIEW_AREAS, lawyerReviewPrice,
} from '@/constants/documentReview';

/**
 * Document reviews: taking the upload, pricing it, confirming its payment,
 * running the AI read, and the lawyer/admin side of an expert review.
 */

function httpError(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

const iso = (d) => (d ? new Date(d).toISOString() : null);

/**
 * Pages in a PDF, read from its page objects. A PDF that hides them inside
 * compressed object streams reads as 0 and is priced as one page — the client
 * is never charged for pages this cannot see.
 */
export function countPdfPages(buffer) {
  const text = buffer.toString('latin1');
  const matches = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  return Math.max(1, matches ? matches.length : 1);
}

/** Plain-object form, safe to hand to a client component. Never the file bytes. */
export function serializeReview(r) {
  if (!r) return null;
  return {
    id: String(r._id),
    kind: r.kind,
    status: r.status,
    userId: String(r.userId || ''),
    userName: r.userName || '',
    userEmail: r.userEmail || '',
    userPhone: r.userPhone || '',
    fileName: r.fileName || '',
    mimeType: r.mimeType || '',
    size: r.size || 0,
    pages: r.pages || 1,
    hasFile: !r.fileDeleted,
    area: r.area || 'other',
    areaLabel: REVIEW_AREAS.find((a) => a.value === r.area)?.label || 'Other',
    question: r.question || '',
    amount: r.amount || 0,
    razorpayOrderId: r.razorpayOrderId || '',
    razorpayPaymentId: r.razorpayPaymentId || '',
    paidAt: iso(r.paidAt),
    paidWith: r.paidWith || 'razorpay',
    ai: r.ai
      ? {
        documentType: r.ai.documentType || '',
        summary: r.ai.summary || '',
        riskLevel: r.ai.riskLevel || '',
        redFlags: (r.ai.redFlags || []).map((f) => ({ title: f.title, detail: f.detail, severity: f.severity })),
        missingClauses: (r.ai.missingClauses || []).map((f) => ({ title: f.title, detail: f.detail })),
        keyTerms: (r.ai.keyTerms || []).map((t) => ({ label: t.label, value: t.value })),
        suggestions: [...(r.ai.suggestions || [])],
        error: r.ai.error || '',
      }
      : null,
    advocateId: r.advocateId ? String(r.advocateId) : '',
    advocateName: r.advocateName || '',
    assignedAt: iso(r.assignedAt),
    report: r.report || '',
    deliveredAt: iso(r.deliveredAt),
    earning: r.earning || 0,
    adminNote: r.adminNote || '',
    createdAt: iso(r.createdAt),
  };
}

/**
 * Take an upload and record it as an unpaid review, priced from the file
 * itself. Nothing is read by anyone until the payment is confirmed.
 *
 * @returns {Promise<object>} the lean, just-created review (without data)
 */
export async function createReview({ user, kind, file, area, question }) {
  if (!['ai', 'expert'].includes(kind)) throw httpError('Choose AI review or lawyer review.');
  if (!file || typeof file === 'string') throw httpError('Please attach your document.');

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.length) throw httpError('The file is empty.');
  if (buffer.length > REVIEW_MAX_BYTES) throw httpError('File is too large (max 5 MB).');
  const mimeType = sniff(buffer);
  if (!mimeType) throw httpError('Please upload a PDF, JPG or PNG file.');

  const pages = mimeType === 'application/pdf' ? countPdfPages(buffer) : 1;
  if (kind === 'ai' && pages > AI_MAX_PAGES) {
    throw httpError(`AI review takes documents up to ${AI_MAX_PAGES} pages. Choose a lawyer review for this one.`);
  }

  await connectDB();
  const doc = await DocumentReview.create({
    kind,
    userId: user.id || user._id,
    userName: user.name || '',
    userEmail: user.email || '',
    userPhone: user.phone || '',
    fileName: String(file.name || 'document').slice(0, 120),
    mimeType,
    size: buffer.length,
    pages,
    data: buffer,
    area: REVIEW_AREAS.some((a) => a.value === area) ? area : 'other',
    question: String(question || '').trim().slice(0, 1000),
    amount: kind === 'ai' ? AI_REVIEW_FEE : lawyerReviewPrice(pages),
    status: 'pending',
  });
  const plain = doc.toObject();
  delete plain.data;
  return plain;
}

export async function setReviewOrder(id, orderId) {
  await connectDB();
  await DocumentReview.updateOne({ _id: id }, { $set: { razorpayOrderId: orderId } });
}

/**
 * Pay for a pending review from the client's wallet, if the balance covers
 * it. The debit is conditional on the balance in the update itself, so two
 * reviews started at once can never take the wallet below zero; if it does
 * not cover it, nothing changes and the caller falls back to Razorpay.
 *
 * @returns {Promise<boolean>} true when paid from the wallet
 */
export async function payReviewFromWallet(review) {
  await connectDB();
  const label = review.kind === 'ai' ? 'AI document review' : `Lawyer document review (${review.pages} page${review.pages === 1 ? '' : 's'})`;
  const debited = await User.findOneAndUpdate(
    { _id: review.userId, walletBalance: { $gte: review.amount } },
    {
      $inc: { walletBalance: -review.amount },
      $push: { walletTransactions: { type: 'debit', amount: review.amount, note: `${label} · ${review.fileName}`.slice(0, 200) } },
    },
    { new: true, select: '_id' }
  ).lean();
  if (!debited) return false;

  const marked = await DocumentReview.updateOne(
    { _id: review._id, status: 'pending' },
    { $set: { status: 'paid', paidWith: 'wallet', paidAt: new Date() } }
  );
  if (!marked.modifiedCount) {
    // The review moved on underneath us — give the money straight back.
    await User.updateOne(
      { _id: review.userId },
      {
        $inc: { walletBalance: review.amount },
        $push: { walletTransactions: { type: 'credit', amount: review.amount, note: `Refund: ${label}` } },
      }
    );
    return false;
  }
  return true;
}

/**
 * Mark a review paid once Razorpay has captured the money. Idempotent — the
 * verify call and the webhook both land here.
 */
export async function markReviewPaid({ reviewId, paymentId, razorpayOrderId = '', amountPaise }) {
  if (!mongoose.isValidObjectId(reviewId) || !paymentId) return { ok: false, error: 'bad_reference' };
  await connectDB();
  const r = await DocumentReview.findById(reviewId).lean();
  if (!r) return { ok: false, error: 'not_found' };
  if (r.razorpayPaymentId === paymentId) return { ok: true, applied: false, review: r };
  if (r.status !== 'pending') return { ok: false, error: `already_${r.status}` };
  if (razorpayOrderId && r.razorpayOrderId && r.razorpayOrderId !== razorpayOrderId) {
    return { ok: false, error: 'order_mismatch' };
  }
  if (Number(amountPaise) < Math.round(r.amount * 100)) return { ok: false, error: 'amount_short' };

  const updated = await DocumentReview.findOneAndUpdate(
    { _id: r._id, status: 'pending' },
    { $set: { status: 'paid', razorpayPaymentId: paymentId, paidAt: new Date(), ...(razorpayOrderId ? { razorpayOrderId } : {}) } },
    { new: true }
  ).lean();
  if (!updated) {
    const now = await DocumentReview.findById(reviewId).lean();
    return now?.razorpayPaymentId === paymentId ? { ok: true, applied: false, review: now } : { ok: false, error: 'state_changed' };
  }
  return { ok: true, applied: true, review: updated };
}

/**
 * Run the AI read on a paid AI review, once. Safe to call from several places
 * (verify, the result page): the first caller claims it, the rest just read.
 * On success the file is deleted; on failure it is kept so it can be retried.
 */
export async function runAiReview(reviewId) {
  await connectDB();
  // Claim: only a paid AI review with no run in progress in the last 3 minutes.
  const staleBefore = new Date(Date.now() - 3 * 60 * 1000);
  const claimed = await DocumentReview.findOneAndUpdate(
    {
      _id: reviewId,
      kind: 'ai',
      status: 'paid',
      $or: [{ runStartedAt: null }, { runStartedAt: { $lt: staleBefore } }],
    },
    { $set: { runStartedAt: new Date() } },
    { new: true }
  ).select('+data').lean();
  if (!claimed) return DocumentReview.findById(reviewId).lean();

  try {
    const result = await reviewDocument({
      buffer: Buffer.from(claimed.data.buffer ?? claimed.data),
      mimeType: claimed.mimeType,
      fileName: claimed.fileName,
      question: claimed.question,
    });
    return await DocumentReview.findByIdAndUpdate(
      reviewId,
      {
        $set: {
          status: 'done',
          ai: {
            documentType: result.isLegal ? result.documentType : 'Not a legal document',
            summary: result.isLegal
              ? result.summary
              : 'This file does not look like a legal document, so there was nothing to review. Contact support for a refund.',
            riskLevel: result.isLegal ? result.riskLevel : '',
            redFlags: result.redFlags,
            missingClauses: result.missingClauses,
            keyTerms: result.keyTerms,
            suggestions: result.suggestions,
            provider: result.provider,
            error: '',
          },
          fileDeleted: true,
          runStartedAt: null,
        },
        $unset: { data: 1 },
      },
      { new: true }
    ).lean();
  } catch (err) {
    console.error('AI document review failed', err);
    return DocumentReview.findByIdAndUpdate(
      reviewId,
      { $set: { 'ai.error': 'The review could not be completed. Try again in a minute.', runStartedAt: null } },
      { new: true }
    ).lean();
  }
}

/** One review, if `viewer` may see it: its client, its assigned lawyer, or an admin. */
export async function getReviewFor(id, viewer) {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const r = await DocumentReview.findById(id).lean();
  if (!r) return null;
  if (viewer.admin) return r;
  if (viewer.userId && String(r.userId) === String(viewer.userId)) return r;
  if (viewer.advocateId && r.advocateId && String(r.advocateId) === String(viewer.advocateId)) return r;
  return null;
}

/** The stored file, if `viewer` may download it. */
export async function readReviewFile(id, viewer) {
  const allowed = await getReviewFor(id, viewer);
  if (!allowed || allowed.fileDeleted) return null;
  const r = await DocumentReview.findById(id).select('+data fileName mimeType size').lean();
  return r?.data ? r : null;
}

export function reviewFileResponse(r) {
  const safeName = String(r.fileName || 'document').replace(/[^\w.\- ]+/g, '_');
  return new Response(Buffer.from(r.data.buffer ?? r.data), {
    headers: {
      'Content-Type': r.mimeType,
      'Content-Length': String(r.size || r.data.length),
      'Content-Disposition': `inline; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/** A client's paid reviews, newest first. */
export async function getReviewsForUser(userId) {
  if (!mongoose.isValidObjectId(userId)) return [];
  await connectDB();
  const rows = await DocumentReview.find({ userId, status: { $ne: 'pending' } }).sort({ createdAt: -1 }).limit(100).lean();
  return rows.map(serializeReview);
}

/** Expert reviews assigned to a lawyer. */
export async function getReviewsForAdvocate(advocateId) {
  if (!mongoose.isValidObjectId(advocateId)) return [];
  await connectDB();
  const rows = await DocumentReview.find({ advocateId, kind: 'expert' }).sort({ assignedAt: -1 }).limit(200).lean();
  return rows.map(serializeReview);
}

/** Every paid review for the admin, with counts. */
export async function adminListReviews({ kind = '', status = '', search = '', page = 1, perPage = 25 } = {}) {
  await connectDB();
  const filter = { status: status && status !== 'all' ? status : { $ne: 'pending' } };
  if (['ai', 'expert'].includes(kind)) filter.kind = kind;
  const term = String(search || '').trim();
  if (term) {
    const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { userName: rx }, { userEmail: rx }, { userPhone: rx }, { fileName: rx }, { paidWith: rx },
      { advocateName: rx }, { razorpayPaymentId: rx }, { razorpayOrderId: rx },
    ];
  }
  const [rows, total, counts] = await Promise.all([
    DocumentReview.find(filter).sort({ createdAt: -1 }).skip(Math.max(0, (page - 1) * perPage)).limit(perPage).lean(),
    DocumentReview.countDocuments(filter),
    DocumentReview.aggregate([
      { $match: { status: { $ne: 'pending' } } },
      { $group: { _id: { kind: '$kind', status: '$status' }, n: { $sum: 1 }, sum: { $sum: '$amount' } } },
    ]),
  ]);
  const stat = (k, s) => counts.filter((c) => (!k || c._id.kind === k) && (!s || c._id.status === s));
  const n = (arr) => arr.reduce((t, c) => t + c.n, 0);
  const sum = (arr) => arr.reduce((t, c) => t + c.sum, 0);
  return {
    rows: rows.map(serializeReview),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    stats: {
      ai: n(stat('ai')),
      waiting: n(stat('expert', 'paid')),
      inReview: n(stat('expert', 'assigned')),
      delivered: n(stat('expert', 'delivered')),
      collected: sum(counts),
    },
  };
}

/** Admin gives an expert review to a lawyer (by id or Justiceland ID). */
export async function assignReview({ id, advocateRef }) {
  await connectDB();
  const ref = String(advocateRef || '').trim();
  const advocate = mongoose.isValidObjectId(ref)
    ? await Advocate.findById(ref).select('name').lean()
    : await Advocate.findOne({ legalCareId: new RegExp(`^${ref.replace(/[^\w-]/g, '')}$`, 'i') }).select('name').lean();
  if (!advocate) throw httpError('No lawyer with that ID.');
  const r = await DocumentReview.findOneAndUpdate(
    { _id: id, kind: 'expert', status: { $in: ['paid', 'assigned'] } },
    { $set: { status: 'assigned', advocateId: advocate._id, advocateName: advocate.name || '', assignedAt: new Date() } },
    { new: true }
  ).lean();
  if (!r) throw httpError('Only a paid review that has not been delivered can be assigned.');
  return serializeReview(r);
}

/**
 * The written report is sent to the client. The assigned lawyer is credited
 * their share (fee less commission) once; a report an admin writes with no
 * lawyer assigned credits nobody.
 */
export async function deliverReview({ id, report, by, advocateId = null }) {
  const text = String(report || '').trim();
  if (text.length < 40) throw httpError('Write the report before sending it (at least a few sentences).');
  await connectDB();
  const filter = { _id: id, kind: 'expert', status: { $in: ['paid', 'assigned'] } };
  if (advocateId) filter.advocateId = advocateId;
  const r = await DocumentReview.findOneAndUpdate(
    filter,
    { $set: { status: 'delivered', report: text.slice(0, 20000), reportBy: by, deliveredAt: new Date() } },
    { new: true }
  ).lean();
  if (!r) throw httpError('This review is not open for a report.');

  if (r.advocateId && !r.earningCredited) {
    const claimed = await DocumentReview.findOneAndUpdate(
      { _id: r._id, earningCredited: false },
      { $set: { earningCredited: true } },
      { new: true }
    ).lean();
    if (claimed) {
      const split = splitEarning(r.amount);
      if (split.earning > 0) {
        await applyLegacyCommission(r.advocateId);
        await Advocate.findByIdAndUpdate(r.advocateId, {
          $inc: { walletBalance: split.earning },
          $push: {
            walletTransactions: {
              type: 'credit', kind: 'earning', amount: split.earning,
              gross: split.gross, commission: split.commission,
              note: `Document review for ${r.userName || 'a client'} (${r.pages} page${r.pages === 1 ? '' : 's'})`,
            },
          },
        });
      }
      await DocumentReview.updateOne({ _id: r._id }, { $set: { earning: split.earning, commission: split.commission } });
    }
  }
  return serializeReview(await DocumentReview.findById(id).lean());
}

export async function cancelReview({ id, note = '' }) {
  await connectDB();
  const r = await DocumentReview.findOneAndUpdate(
    { _id: id, status: { $in: ['paid', 'assigned'] } },
    { $set: { status: 'cancelled', adminNote: String(note || '').slice(0, 300) } },
    { new: true }
  ).lean();
  if (!r) throw httpError('Only a paid review that is not finished can be cancelled.');
  return serializeReview(r);
}

/** Paid lawyer reviews nobody has been given yet — the admin's to-do count. */
export async function countReviewsWaiting() {
  try {
    await connectDB();
    return await DocumentReview.countDocuments({ kind: 'expert', status: 'paid' });
  } catch {
    return 0;
  }
}

/** Which practice areas suit each kind of document, for suggesting a lawyer. */
const AREA_PRACTICE = {
  property: ['Property Law', 'Real Estate / RERA', 'Civil Law'],
  corporate: ['Corporate Law', 'Intellectual Property', 'Tax Law'],
  employment: ['Labour & Employment', 'Corporate Law'],
  family: ['Family Law', 'Civil Law'],
  notice: ['Civil Law', 'Criminal Law', 'Consumer Law'],
  other: [],
};

/**
 * Lawyers an admin might give a review to: by name or Justiceland ID when
 * searching, otherwise the ones practising in the document's area — online
 * and more experienced first.
 */
export async function suggestLawyers({ area = 'other', q = '' } = {}) {
  await connectDB();
  const filter = { status: 'published' };
  const term = String(q || '').trim();
  if (term) {
    const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { legalCareId: rx }, { city: rx }];
  } else if (AREA_PRACTICE[area]?.length) {
    filter.specializations = { $in: AREA_PRACTICE[area] };
  }
  const rows = await Advocate.find(filter)
    .select('name legalCareId city specializations experience available')
    .sort({ available: -1, createdAt: -1 })
    .limit(60)
    .lean();
  // Some lawyers typed the year they started ("2019") as their experience;
  // anything past a working lifetime is treated as unknown, not as the most
  // experienced lawyer on the list.
  const years = (a) => (Number(a.experience) > 0 && Number(a.experience) <= 60 ? Number(a.experience) : 0);
  const wanted = AREA_PRACTICE[area] || [];
  const picked = rows
    .sort((x, y) => Number(y.available) - Number(x.available) || years(y) - years(x))
    .slice(0, 8);
  return picked.map((a) => ({
    id: String(a._id),
    name: a.name || '',
    legalCareId: a.legalCareId || '',
    city: a.city || '',
    experience: years(a),
    available: Boolean(a.available),
    // The practice that matched the document first, so the reason for the
    // suggestion is the first thing read.
    practice: [...(a.specializations || [])]
      .sort((x, y) => Number(wanted.includes(y)) - Number(wanted.includes(x)))
      .slice(0, 2)
      .join(', '),
  }));
}

/** A client's most recent finished AI review, or null. */
export async function getLatestAiReview(userId) {
  if (!mongoose.isValidObjectId(userId)) return null;
  await connectDB();
  const r = await DocumentReview.findOne({ userId, kind: 'ai', status: 'done', 'ai.documentType': { $ne: '' } })
    .sort({ createdAt: -1 })
    .lean();
  return r ? serializeReview(r) : null;
}
