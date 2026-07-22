import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import Consultation from '@/models/Consultation';
import User from '@/models/User';
import Advocate from '@/models/Advocate';

/**
 * Consultation data-access + the wallet transfer that happens on connect.
 */

// A lawyer counts as "online" if their listener checked in within this
// window (the listener polls every 3s).
export const ONLINE_WINDOW_MS = 12000;

// A video call that nobody picks up within this window gives up on its own.
export const CALL_RING_TIMEOUT_MS = 45000;

/** Heartbeat: mark the lawyer as currently present. */
export async function markAdvocateOnline(advocateId) {
  await connectDB();
  await Advocate.updateOne({ _id: advocateId }, { $set: { lastSeenAt: new Date() } });
}

/**
 * Is the lawyer online right now? They must have manually switched
 * themselves available AND have a recent heartbeat (site open).
 */
export async function isAdvocateOnline(advocateId) {
  await connectDB();
  const adv = await Advocate.findById(advocateId).select('lastSeenAt available').lean();
  if (!adv?.available || !adv?.lastSeenAt) return false;
  return Date.now() - new Date(adv.lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

/**
 * The lightweight call summary that rides along on the ordinary chat poll, so
 * the lawyer sees an incoming ring without running a second poller. The bulky
 * signalling payloads (SDP + ICE) are deliberately left out — those are only
 * fetched from /api/consultations/[id]/call while a call is actually up.
 */
function callSummary(call) {
  return {
    id: call?.id || '',
    status: call?.status || 'idle',
    endedReason: call?.endedReason || '',
    endedBy: call?.endedBy || '',
  };
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
    call: callSummary(s.call),
    messages: (s.messages || []).map((m) => ({
      id: m._id,
      from: m.from,
      text: m.text,
      at: m.at,
    })),
  };
}

/**
 * The full, continuous transcript between one user and one lawyer across
 * EVERY consultation they've ever had, ordered oldest-first. This is what makes
 * the chat resume where it left off: book again and the whole past conversation
 * is still there, with the new session's messages appended.
 */
export async function getPairMessages(userId, advocateId) {
  await connectDB();
  const rows = await Consultation.find({ userId, advocateId }).select('messages').lean();
  const all = [];
  for (const r of rows) {
    for (const m of r.messages || []) {
      all.push({ id: String(m._id), from: m.from, text: m.text, at: m.at });
    }
  }
  all.sort((a, b) => new Date(a.at) - new Date(b.at));
  return all;
}

/**
 * Read-only transcript for a history row: the full saved conversation between
 * the two parties, gated to the logged-in participant. Free to read — no charge,
 * no writes. `role` is the caller's role; `participantId` their own id.
 */
export async function getTranscriptFor(consultationId, participantId, role) {
  await connectDB();
  const row = await Consultation.findById(consultationId)
    .select('userId advocateId userName advocateName')
    .lean();
  if (!row) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }

  const isUser = role === 'user' && String(row.userId) === String(participantId);
  const isAdvocate = role === 'advocate' && String(row.advocateId) === String(participantId);
  if (!isUser && !isAdvocate) { const e = new Error('Forbidden'); e.code = 'FORBIDDEN'; throw e; }

  return {
    messages: await getPairMessages(row.userId, row.advocateId),
    otherName: role === 'user' ? (row.advocateName || 'Lawyer') : (row.userName || 'Client'),
  };
}

/**
 * Replace a serialized session's `messages` with the full pair history, so the
 * live chat always shows the entire conversation (not just this one session).
 */
async function withPairHistory(session) {
  if (!session) return session;
  const messages = await getPairMessages(session.userId, session.advocateId);
  return { ...session, messages };
}

/**
 * Mark a live call as over, in memory. The caller is responsible for saving.
 * A no-op once the call is already idle/ended, so it's safe to call blindly.
 */
function closeCall(session, reason, by = '') {
  const call = session.call;
  if (!call || call.status === 'idle' || call.status === 'ended') return false;
  call.status = 'ended';
  call.endedReason = reason;
  call.endedBy = by;
  call.endedAt = new Date();
  return true;
}

/**
 * Flip an active-but-expired session to `ended` (lazy, on read), and settle a
 * video call that outlived it or that nobody ever picked up.
 */
async function settleIfExpired(session) {
  if (!session) return session;
  let dirty = false;

  if (session.status === 'active' && session.endsAt && new Date(session.endsAt) <= new Date()) {
    session.status = 'ended';
    session.endedAt = session.endsAt; // ran the full booked time
    dirty = true;
  }

  // A call can never outlive the consultation that paid for it.
  if (session.status !== 'active') {
    dirty = closeCall(session, 'session-ended') || dirty;
  } else if (
    session.call?.status === 'ringing' &&
    session.call.ringingAt &&
    Date.now() - new Date(session.call.ringingAt).getTime() > CALL_RING_TIMEOUT_MS
  ) {
    // Rang out — the lawyer never answered.
    dirty = closeCall(session, 'unanswered') || dirty;
  }

  if (dirty) await session.save();
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
    advocateName: r.advocateName || 'Lawyer',
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
 * A lawyer's consultation history (most recent first) for their dashboard —
 * who they chatted with, for how long, and what they earned.
 *
 * Rows the lawyer cleared are still returned (flagged `hidden`) so earnings
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

/** Fetch one session (settling expiry first) with the full pair transcript. */
export async function getConsultation(id) {
  await connectDB();
  const doc = await Consultation.findById(id);
  if (!doc) return null;
  await settleIfExpired(doc);
  return withPairHistory(serializeSession(doc.toObject()));
}

/** Pending + active sessions for a lawyer (the incoming-call feed). */
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
 * Lawyer accepts: charge the user's wallet, credit the lawyer, open the
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

  // Credit the lawyer's earnings wallet.
  await Advocate.findByIdAndUpdate(advocateId, {
    $inc: { walletBalance: session.price },
    $push: { walletTransactions: { type: 'credit', amount: session.price, note: `Consultation with ${session.userName}` } },
  });

  const startedAt = new Date();
  session.status = 'active';
  session.startedAt = startedAt;
  session.endsAt = new Date(startedAt.getTime() + session.minutes * 60 * 1000);
  await session.save();
  return withPairHistory(serializeSession(session.toObject()));
}

/** Lawyer rejects a pending request (no charge). */
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
  return withPairHistory(serializeSession(session.toObject()));
}

/* ── Video call ─────────────────────────────────────────────────────────── */

/** Throw unless the caller is one of the two participants. */
function assertParticipant(session, participantId, role) {
  const ok =
    (role === 'user' && String(session.userId) === String(participantId)) ||
    (role === 'advocate' && String(session.advocateId) === String(participantId));
  if (!ok) { const e = new Error('Not a participant'); e.code = 'FORBIDDEN'; throw e; }
}

/** Load a session for a call action, settling expiry and checking access. */
async function loadForCall(id, participantId, role) {
  await connectDB();
  let session;
  try {
    session = await Consultation.findById(id);
  } catch {
    const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e;
  }
  if (!session) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
  assertParticipant(session, participantId, role);
  await settleIfExpired(session);
  return session;
}

/**
 * The client rings the lawyer. Only inside a live consultation — the video
 * call rides on the session that was already paid for, so there is no extra
 * charge and no separate booking.
 *
 * Wipes the previous attempt's signalling and stamps a fresh `call.id`, so a
 * second call in the same session never picks up stale SDP or ICE.
 */
export async function startCall(id, userId) {
  const session = await loadForCall(id, userId, 'user');
  if (session.status !== 'active') {
    const e = new Error('Session not active'); e.code = 'BAD_STATE'; throw e;
  }
  if (session.call?.status === 'ringing' || session.call?.status === 'active') {
    const e = new Error('A call is already in progress'); e.code = 'BAD_STATE'; throw e;
  }

  session.call = {
    id: crypto.randomUUID(),
    status: 'ringing',
    endedReason: '',
    endedBy: '',
    offer: '',
    answer: '',
    userCandidates: [],
    advocateCandidates: [],
    ringingAt: new Date(),
    connectedAt: null,
    endedAt: null,
  };
  await session.save();
  return callSummary(session.call);
}

/**
 * The lawyer answers the ring: `accept` opens the media exchange, otherwise
 * the call is closed as rejected. Either way the chat carries on untouched.
 */
export async function answerCall(id, advocateId, accept) {
  const session = await loadForCall(id, advocateId, 'advocate');
  if (session.call?.status !== 'ringing') {
    const e = new Error('No incoming call'); e.code = 'BAD_STATE'; throw e;
  }

  if (accept) {
    session.call.status = 'active';
    session.call.connectedAt = new Date();
  } else {
    closeCall(session, 'rejected', 'advocate');
  }
  await session.save();
  return callSummary(session.call);
}

/** Either side hangs up (or their browser gives up on the connection). */
export async function hangUpCall(id, participantId, role, reason = 'hangup') {
  const session = await loadForCall(id, participantId, role);
  closeCall(session, reason, role);
  await session.save();
  return callSummary(session.call);
}

/**
 * Store one signalling payload from a participant: their SDP offer/answer, or
 * a trickled ICE candidate appended to their own queue for the other side to
 * drain. Ignored once the call is over, so a late candidate can't revive it.
 */
export async function pushCallSignal(id, participantId, role, { callId, offer, answer, candidate }) {
  const session = await loadForCall(id, participantId, role);
  const call = session.call;
  if (!call || !['ringing', 'active'].includes(call.status)) {
    const e = new Error('No call in progress'); e.code = 'BAD_STATE'; throw e;
  }
  // Guard against a stale tab signalling into a newer call.
  if (callId && call.id !== callId) {
    const e = new Error('Stale call'); e.code = 'BAD_STATE'; throw e;
  }

  if (offer) {
    if (role !== 'user') { const e = new Error('Only the caller offers'); e.code = 'FORBIDDEN'; throw e; }
    call.offer = offer;
  }
  if (answer) {
    if (role !== 'advocate') { const e = new Error('Only the callee answers'); e.code = 'FORBIDDEN'; throw e; }
    call.answer = answer;
  }
  if (candidate) {
    const queue = role === 'user' ? call.userCandidates : call.advocateCandidates;
    // Bound the queue — a normal call trickles well under this.
    if (queue.length < 200) queue.push(candidate);
  }

  await session.save();
  return callSummary(session.call);
}

/**
 * The other side's half of the handshake, for the 1s poll a browser runs while
 * a call is up: their SDP plus any ICE candidates past `since`. `nextSince` is
 * the cursor to send on the following poll.
 */
export async function getCallState(id, participantId, role, since = 0) {
  const session = await loadForCall(id, participantId, role);
  const call = session.call || {};
  const theirs = role === 'user' ? call.advocateCandidates : call.userCandidates;
  const queue = theirs || [];
  const from = Math.max(0, Math.min(Number(since) || 0, queue.length));

  return {
    call: {
      ...callSummary(call),
      // Each side only ever needs the *other* side's description.
      offer: role === 'advocate' ? call.offer || '' : '',
      answer: role === 'user' ? call.answer || '' : '',
    },
    candidates: queue.slice(from),
    nextSince: queue.length,
    // The call dies with the consultation, so the poll carries that too.
    sessionStatus: session.status,
    endsAt: session.endsAt || null,
  };
}
