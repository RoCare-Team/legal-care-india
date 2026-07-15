import { connectDB } from '@/lib/db';
import Consultation from '@/models/Consultation';
import User from '@/models/User';
import Advocate from '@/models/Advocate';

/**
 * Consultation data-access + the wallet transfer that happens on connect.
 */

// An advocate counts as "online" if their listener checked in within this
// window (the listener polls every 3s).
const ONLINE_WINDOW_MS = 12000;

/** Heartbeat: mark the advocate as currently present. */
export async function markAdvocateOnline(advocateId) {
  await connectDB();
  await Advocate.updateOne({ _id: advocateId }, { $set: { lastSeenAt: new Date() } });
}

/** Is the advocate online (recent heartbeat)? */
export async function isAdvocateOnline(advocateId) {
  await connectDB();
  const adv = await Advocate.findById(advocateId).select('lastSeenAt').lean();
  if (!adv?.lastSeenAt) return false;
  return Date.now() - new Date(adv.lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

/** Plain, client-safe session object with a computed remaining time. */
export function serializeSession(doc) {
  if (!doc) return null;
  const s = JSON.parse(JSON.stringify(doc));
  const endsAt = s.endsAt ? new Date(s.endsAt).getTime() : null;
  const remainingMs = endsAt ? Math.max(0, endsAt - Date.now()) : null;
  return {
    id: s._id,
    userId: String(s.userId),
    userName: s.userName || '',
    advocateId: String(s.advocateId),
    advocateName: s.advocateName || '',
    minutes: s.minutes,
    price: s.price,
    status: s.status,
    startedAt: s.startedAt || null,
    endsAt: s.endsAt || null,
    remainingMs,
    messages: (s.messages || []).map((m) => ({
      id: m._id,
      from: m.from,
      text: m.text,
      at: m.at,
    })),
  };
}

/** Flip an active-but-expired session to `ended` (lazy, on read). */
async function settleIfExpired(session) {
  if (session && session.status === 'active' && session.endsAt && new Date(session.endsAt) <= new Date()) {
    session.status = 'ended';
    session.endedAt = session.endsAt; // ran the full booked time
    await session.save();
  }
  return session;
}

/** Actual minutes talked (rounded), or the booked minutes as a fallback. */
function talkedMinutes(s) {
  if (!s.startedAt) return 0;
  const end = s.endedAt ? new Date(s.endedAt) : (s.status === 'active' ? new Date() : null);
  if (!end) return s.minutes;
  return Math.max(0, Math.round((end.getTime() - new Date(s.startedAt).getTime()) / 60000));
}

/**
 * Shared shape for a consultation row in the account / dashboard history.
 * `hidden` is resolved for the viewer — each side clears their own list.
 *
 * @param {object} r  lean Consultation doc
 * @param {'user'|'advocate'} viewer
 */
function toHistoryRow(r, viewer) {
  return {
    id: String(r._id),
    userId: String(r.userId),
    userName: r.userName || 'Client',
    advocateId: String(r.advocateId),
    advocateName: r.advocateName || 'Advocate',
    minutes: r.minutes,
    price: r.price,
    status: r.status,
    // Only a connected session cost money / had a conversation.
    charged: ['active', 'ended'].includes(r.status),
    talkedMinutes: talkedMinutes(r),
    messagesCount: (r.messages || []).length,
    startedAt: r.startedAt || null,
    createdAt: r.createdAt,
    // Cleared from this viewer's own list (the other side is unaffected).
    hidden: Boolean(viewer === 'advocate' ? r.hiddenForAdvocate : r.hiddenForUser),
  };
}

/**
 * A user's consultation history (most recent first) for their account page.
 */
export async function getUserConsultations(userId) {
  await connectDB();
  const rows = await Consultation.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();
  return rows.map((r) => toHistoryRow(r, 'user'));
}

/**
 * An advocate's consultation history (most recent first) for their dashboard —
 * who they chatted with, for how long, and what they earned.
 *
 * Rows the advocate cleared are still returned (flagged `hidden`) so earnings
 * totals stay accurate; the dashboard filters them out of the visible list.
 */
export async function getAdvocateConsultations(advocateId) {
  await connectDB();
  const rows = await Consultation.find({ advocateId }).sort({ createdAt: -1 }).limit(100).lean();
  return rows.map((r) => toHistoryRow(r, 'advocate'));
}

/**
 * Clear a consultation from one participant's own list. The document is kept,
 * so the other side's history and the money ledger are untouched. Refuses while
 * the chat is still live.
 *
 * @param {string} id
 * @param {string} participantId  the viewer's own id
 * @param {'user'|'advocate'} viewer
 */
export async function hideConsultationFor(id, participantId, viewer) {
  await connectDB();
  const query = viewer === 'advocate'
    ? { _id: id, advocateId: participantId }
    : { _id: id, userId: participantId };

  const session = await Consultation.findOne(query);
  if (!session) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
  await settleIfExpired(session);
  if (session.status === 'active') {
    const e = new Error('Session is live'); e.code = 'BAD_STATE'; throw e;
  }

  if (viewer === 'advocate') session.hiddenForAdvocate = true;
  else session.hiddenForUser = true;
  await session.save();
  return true;
}

/** Create a pending consultation request (no charge yet). */
export async function createConsultation({ userId, userName, advocateId, advocateName, minutes, price }) {
  await connectDB();
  const doc = await Consultation.create({
    userId, userName, advocateId, advocateName, minutes, price, status: 'pending',
  });
  return serializeSession(doc.toObject());
}

/** Fetch one session (settling expiry first). */
export async function getConsultation(id) {
  await connectDB();
  const doc = await Consultation.findById(id);
  if (!doc) return null;
  await settleIfExpired(doc);
  return serializeSession(doc.toObject());
}

/** Pending + active sessions for an advocate (the incoming-call feed). */
export async function getAdvocateInbox(advocateId) {
  await connectDB();
  const rows = await Consultation.find({
    advocateId,
    status: { $in: ['pending', 'active'] },
  })
    .sort({ createdAt: -1 })
    .limit(10);
  const settled = await Promise.all(rows.map((r) => settleIfExpired(r)));
  return settled.map((r) => serializeSession(r.toObject()));
}

/**
 * Advocate accepts: charge the user's wallet, credit the advocate, open the
 * chat with a hard end time. Returns { session } or throws a coded error.
 */
export async function acceptConsultation(id, advocateId) {
  await connectDB();
  const session = await Consultation.findOne({ _id: id, advocateId });
  if (!session) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
  if (session.status !== 'pending') { const e = new Error('Already handled'); e.code = 'BAD_STATE'; throw e; }

  // Atomically debit the user only if they still have enough balance.
  const debited = await User.findOneAndUpdate(
    { _id: session.userId, walletBalance: { $gte: session.price } },
    {
      $inc: { walletBalance: -session.price },
      $push: { walletTransactions: { type: 'debit', amount: session.price, note: `Consultation with ${session.advocateName}` } },
    },
    { new: true }
  ).lean();

  if (!debited) { const e = new Error('Insufficient balance'); e.code = 'INSUFFICIENT'; throw e; }

  // Credit the advocate's earnings wallet.
  await Advocate.findByIdAndUpdate(advocateId, {
    $inc: { walletBalance: session.price },
    $push: { walletTransactions: { type: 'credit', amount: session.price, note: `Consultation with ${session.userName}` } },
  });

  const startedAt = new Date();
  session.status = 'active';
  session.startedAt = startedAt;
  session.endsAt = new Date(startedAt.getTime() + session.minutes * 60 * 1000);
  await session.save();
  return serializeSession(session.toObject());
}

/** Advocate rejects a pending request (no charge). */
export async function rejectConsultation(id, advocateId) {
  await connectDB();
  const session = await Consultation.findOne({ _id: id, advocateId });
  if (!session) return null;
  if (session.status === 'pending') {
    session.status = 'rejected';
    await session.save();
  }
  return serializeSession(session.toObject());
}

/** User cancels while still pending (no charge). */
export async function cancelConsultation(id, userId) {
  await connectDB();
  const session = await Consultation.findOne({ _id: id, userId });
  if (!session) return null;
  if (session.status === 'pending') {
    session.status = 'cancelled';
    await session.save();
  }
  return serializeSession(session.toObject());
}

/** Either participant ends an active session early. */
export async function endConsultation(id, participantId) {
  await connectDB();
  const session = await Consultation.findOne({
    _id: id,
    $or: [{ userId: participantId }, { advocateId: participantId }],
  });
  if (!session) return null;
  if (session.status === 'active') {
    session.status = 'ended';
    session.endedAt = new Date();
    await session.save();
  }
  return serializeSession(session.toObject());
}

/** Post a chat message from a participant into an active, unexpired session. */
export async function addMessage(id, participantId, from, text) {
  await connectDB();
  const session = await Consultation.findById(id);
  if (!session) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
  await settleIfExpired(session);

  const isUser = String(session.userId) === String(participantId);
  const isAdvocate = String(session.advocateId) === String(participantId);
  if ((from === 'user' && !isUser) || (from === 'advocate' && !isAdvocate) || (!isUser && !isAdvocate)) {
    const e = new Error('Not a participant'); e.code = 'FORBIDDEN'; throw e;
  }
  if (session.status !== 'active') { const e = new Error('Session not active'); e.code = 'BAD_STATE'; throw e; }

  session.messages.push({ from, text: text.trim(), at: new Date() });
  await session.save();
  return serializeSession(session.toObject());
}
