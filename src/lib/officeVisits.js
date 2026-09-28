import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import OfficeVisit from '@/models/OfficeVisit';
import Advocate from '@/models/Advocate';
import { applyLegacyCommission } from '@/lib/payouts';
import { splitEarning } from '@/constants/payouts';


/**
 * In-person office visits: what a lawyer offers, booking one, confirming the
 * Razorpay payment for it, and the admin's handling afterwards.
 */

/** Statuses at which a slot counts as taken. */
const HOLDING = ['paid', 'completed'];

const iso = (d) => (d ? new Date(d).toISOString() : null);

/** Plain-object form, safe to hand to a client component. */
export function serializeVisit(v) {
  if (!v) return null;
  return {
    id: String(v._id),
    userId: String(v.userId || ''),
    userName: v.userName || '',
    userEmail: v.userEmail || '',
    userPhone: v.userPhone || '',
    advocateId: String(v.advocateId || ''),
    advocateName: v.advocateName || '',
    legalCareId: v.legalCareId || '',
    office: {
      name: v.office?.name || '',
      address: v.office?.address || '',
      pincode: v.office?.pincode || '',
    },
    date: v.date,
    time: v.time,
    note: v.note || '',
    amount: v.amount || 0,
    status: v.status,
    razorpayOrderId: v.razorpayOrderId || '',
    razorpayPaymentId: v.razorpayPaymentId || '',
    paidAt: iso(v.paidAt),
    earning: v.earning || 0,
    commission: v.commission || 0,
    earningCredited: Boolean(v.earningCredited),
    completedAt: iso(v.completedAt),
    cancelledAt: iso(v.cancelledAt),
    adminNote: v.adminNote || '',
    createdAt: iso(v.createdAt),
  };
}

/** Slot start times already taken for a lawyer on a date. */
export async function takenSlots(advocateId, date) {
  if (!mongoose.isValidObjectId(advocateId)) return [];
  await connectDB();
  const rows = await OfficeVisit.find({ advocateId, date, status: { $in: HOLDING } })
    .select('time')
    .lean();
  return rows.map((r) => r.time);
}

/**
 * Mark a visit paid once Razorpay has captured the money. Idempotent: the
 * browser's verify call and the webhook both land here, and only the first
 * one changes anything.
 *
 * @returns {Promise<{ok: boolean, applied?: boolean, error?: string, visit?: object}>}
 */
export async function markVisitPaid({ visitId, paymentId, razorpayOrderId = '', amountPaise }) {
  if (!mongoose.isValidObjectId(visitId) || !paymentId) return { ok: false, error: 'bad_reference' };
  await connectDB();

  const visit = await OfficeVisit.findById(visitId).lean();
  if (!visit) return { ok: false, error: 'not_found' };

  if (visit.razorpayPaymentId === paymentId) return { ok: true, applied: false, visit: serializeVisit(visit) };
  if (visit.status !== 'pending') return { ok: false, error: `already_${visit.status}` };
  if (razorpayOrderId && visit.razorpayOrderId && visit.razorpayOrderId !== razorpayOrderId) {
    return { ok: false, error: 'order_mismatch' };
  }
  if (Number(amountPaise) < Math.round(visit.amount * 100)) return { ok: false, error: 'amount_short' };

  // Two clients can pay for the same slot within seconds of each other. Both
  // have paid, so both bookings stand — the second is flagged for the admin
  // to move or refund rather than silently dropped.
  const clash = await OfficeVisit.exists({
    _id: { $ne: visit._id },
    advocateId: visit.advocateId,
    date: visit.date,
    time: visit.time,
    status: { $in: HOLDING },
  });

  const updated = await OfficeVisit.findOneAndUpdate(
    { _id: visit._id, status: 'pending' },
    {
      $set: {
        status: 'paid',
        razorpayPaymentId: paymentId,
        ...(razorpayOrderId ? { razorpayOrderId } : {}),
        paidAt: new Date(),
        ...(clash ? { adminNote: 'Slot clash: another paid booking holds this time. Reschedule or refund.' } : {}),
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    const now = await OfficeVisit.findById(visitId).lean();
    return now?.razorpayPaymentId === paymentId
      ? { ok: true, applied: false, visit: serializeVisit(now) }
      : { ok: false, error: 'state_changed' };
  }
  return { ok: true, applied: true, visit: serializeVisit(updated) };
}

/** A client's own visits, newest first (unpaid attempts left out). */
export async function getVisitsForUser(userId) {
  if (!mongoose.isValidObjectId(userId)) return [];
  await connectDB();
  const rows = await OfficeVisit.find({ userId, status: { $ne: 'pending' } })
    .sort({ date: -1, time: -1 })
    .limit(100)
    .lean();
  return rows.map(serializeVisit);
}

/** Visits booked with a lawyer, soonest upcoming first. */
export async function getVisitsForAdvocate(advocateId) {
  if (!mongoose.isValidObjectId(advocateId)) return [];
  await connectDB();
  const rows = await OfficeVisit.find({ advocateId, status: { $ne: 'pending' } })
    .sort({ date: -1, time: -1 })
    .limit(200)
    .lean();
  return rows.map(serializeVisit);
}

/**
 * Every visit for the admin panel, with totals.
 *
 * @param {{status?: string, search?: string, page?: number, perPage?: number}} opts
 *   `status` '' shows every booking that was paid for; 'pending' shows the
 *   checkouts that were opened and never paid.
 */
export async function adminListVisits({ status = '', search = '', page = 1, perPage = 25 } = {}) {
  await connectDB();

  const filter = {};
  if (['pending', 'paid', 'completed', 'cancelled'].includes(status)) filter.status = status;
  else filter.status = { $ne: 'pending' };

  const term = String(search || '').trim();
  if (term) {
    const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { userName: rx }, { userEmail: rx }, { userPhone: rx },
      { advocateName: rx }, { legalCareId: rx },
      { razorpayPaymentId: rx }, { razorpayOrderId: rx }, { date: rx },
    ];
  }

  const [rows, total, counts] = await Promise.all([
    OfficeVisit.find(filter)
      .sort({ createdAt: -1 })
      .skip(Math.max(0, (page - 1) * perPage))
      .limit(perPage)
      .lean(),
    OfficeVisit.countDocuments(filter),
    OfficeVisit.aggregate([{ $group: { _id: '$status', n: { $sum: 1 }, sum: { $sum: '$amount' } } }]),
  ]);

  const by = Object.fromEntries(counts.map((c) => [c._id, { count: c.n, sum: c.sum }]));
  return {
    rows: rows.map(serializeVisit),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    status: filter.status?.$ne ? '' : status,
    stats: {
      upcoming: by.paid?.count || 0,
      completed: by.completed?.count || 0,
      cancelled: by.cancelled?.count || 0,
      unpaid: by.pending?.count || 0,
      collected: (by.paid?.sum || 0) + (by.completed?.sum || 0) + (by.cancelled?.sum || 0),
    },
  };
}

/**
 * Admin moves a paid visit on.
 *
 *  - 'complete': the visit happened. The lawyer's share (the fee less
 *    JusticeLand's commission) goes into their earnings wallet, once.
 *  - 'cancel': it will not happen. Any refund is issued from the Razorpay
 *    dashboard; this only records the decision.
 *
 * @returns {Promise<{ok: boolean, error?: string, visit?: object}>}
 */
export async function adminUpdateVisit({ id, action, note = '', adminEmail = '' }) {
  if (!mongoose.isValidObjectId(id)) return { ok: false, error: 'Visit not found.' };
  await connectDB();

  const by = adminEmail || 'admin';
  const adminNote = String(note || '').trim().slice(0, 300);

  if (action === 'cancel') {
    const visit = await OfficeVisit.findOneAndUpdate(
      { _id: id, status: 'paid' },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          updatedBy: by,
          ...(adminNote ? { adminNote } : {}),
        },
      },
      { new: true }
    ).lean();
    if (!visit) return { ok: false, error: 'Only an upcoming (paid) visit can be cancelled.' };
    return { ok: true, visit: serializeVisit(visit) };
  }

  if (action === 'complete') {
    // Claiming the credit and changing the status in one write is what makes
    // a double-click unable to pay the lawyer twice.
    const visit = await OfficeVisit.findOneAndUpdate(
      { _id: id, status: 'paid', earningCredited: false },
      {
        $set: {
          status: 'completed',
          completedAt: new Date(),
          earningCredited: true,
          updatedBy: by,
          ...(adminNote ? { adminNote } : {}),
        },
      },
      { new: true }
    ).lean();
    if (!visit) return { ok: false, error: 'Only an upcoming (paid) visit can be marked done.' };

    const split = splitEarning(visit.amount);
    if (split.earning > 0) {
      await applyLegacyCommission(visit.advocateId);
      await Advocate.findByIdAndUpdate(visit.advocateId, {
        $inc: { walletBalance: split.earning },
        $push: {
          walletTransactions: {
            type: 'credit',
            kind: 'earning',
            amount: split.earning,
            gross: split.gross,
            commission: split.commission,
            note: `In-person visit with ${visit.userName || 'a client'} on ${visit.date}`,
          },
        },
      });
    }
    const saved = await OfficeVisit.findByIdAndUpdate(
      visit._id,
      { $set: { earning: split.earning, commission: split.commission } },
      { new: true }
    ).lean();
    return { ok: true, visit: serializeVisit(saved) };
  }

  return { ok: false, error: 'Unknown action.' };
}
