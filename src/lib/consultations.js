import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import Consultation from '@/models/Consultation';
import User from '@/models/User';
import Advocate from '@/models/Advocate';
import { chargeForDuration } from '@/constants/callRates';

/**
 * Consultation data-access + the wallet transfer that settles a session.
 *
 * Sessions are billed by the minute, at the end. Nothing is taken when the
 * lawyer accepts — the clock simply starts — and `settleCharges` moves the
 * money once the session is over, for the minutes it actually ran.
 */

// How recently the lawyer's listener checked in. Kept as a record of activity
// (`lastSeenAt`) — it no longer decides online/offline, which is purely their
// own availability switch.
export const ONLINE_WINDOW_MS = 12000;

// A video call that nobody picks up within this window gives up on its own.
export const CALL_RING_TIMEOUT_MS = 45000;

// Free-resume rules for leftover time when a session ends early.
const RESUME_MIN_LEFTOVER_MS = 60 * 1000;              // ≥ 1 min left to bother
const RESUME_WINDOW_MS = 24 * 60 * 60 * 1000;          // resumable for 24h after

/** Unused milliseconds on an ended session (0 if it ran its full time). */
function leftoverMs(s) {
  if (!s?.endsAt || !s?.endedAt) return 0;
  return Math.max(0, new Date(s.endsAt).getTime() - new Date(s.endedAt).getTime());
}

/**
 * Whether a session's unused time can be reconnected for free.
 *
 * Always false now. Leftover time was a consequence of selling fixed blocks:
 * a client who bought thirty minutes and finished in ten had paid for twenty
 * they never used, and the free resume gave those back. Per-minute billing
 * charges only the minutes that ran, so there is nothing left over to return —
 * `endsAt` is a wallet ceiling, not time anyone paid for.
 *
 * Kept as a single false rather than deleted so every caller keeps its shape
 * while the resume UI is retired.
 */
function isResumable() {
  return false;
}

/** Heartbeat: mark the lawyer as currently present. */
export async function markAdvocateOnline(advocateId) {
  await connectDB();
  await Advocate.updateOne({ _id: advocateId }, { $set: { lastSeenAt: new Date() } });
}

/**
 * Is the lawyer online right now?
 *
 * Their own availability switch is the answer — nothing else. It used to also
 * require a recent heartbeat, which meant a lawyer who had set themselves
 * available but closed the tab read as Offline: they are reachable on the
 * phone whether or not a browser is open, so the site was contradicting them.
 * Switching to Offline still hides them everywhere, instantly.
 */
export async function isAdvocateOnline(advocateId) {
  await connectDB();
  const adv = await Advocate.findById(advocateId).select('available').lean();
  return Boolean(adv?.available);
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
    // ₹ per minute this session bills at, and the most minutes the wallet can
    // cover — what the live cost meter on both screens counts against.
    rate: s.rate || 0,
    maxMinutes: s.maxMinutes || 0,
    // What was actually billed. Both are 0 until the session ends.
    minutes: s.minutes || 0,
    price: s.price || 0,
    // 'chat' | 'video' | 'audio' — drives which UI the participants open.
    type: s.type || 'chat',
    // A free reconnection of leftover time (no charge). Lets both sides label
    // the session correctly instead of showing "₹0".
    isResume: Boolean(s.resumedFromId),
    status: s.status,
    // When the request was made — an audio call needs it to know how long the
    // lawyer's phone has been ringing.
    createdAt: s.createdAt || null,
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
 * Move the money for a finished session: the minutes it ran, at its own rate,
 * out of the user's wallet and into the lawyer's.
 *
 * Claims the settlement atomically before touching a balance. A session can be
 * finalised by either side hanging up, or lazily by whichever poll first
 * notices it expired, and those can happen at the same moment — the claim is
 * what makes the transfer happen exactly once.
 *
 * The charge is capped at `maxMinutes` (what the wallet could afford when the
 * session was booked) and again at the balance actually present, so a wallet
 * spent elsewhere mid-session can go to zero but never below it. The lawyer is
 * credited what was really collected, not what was billed.
 *
 * @param {import('mongoose').Document} session  an ended session
 * @returns {Promise<boolean>} whether this call was the one that settled it
 */
async function settleCharges(session) {
  if (!session || session.settled) return false;

  // Claim first — everything below must run for one caller only.
  const claimed = await Consultation.findOneAndUpdate(
    { _id: session._id, settled: false },
    { $set: { settled: true } }
  ).lean();
  if (!claimed) {
    session.settled = true;
    return false;
  }
  session.settled = true;

  const rate = Number(session.rate) || 0;
  // Never connected, or a channel with no rate — nothing to bill either way.
  if (!session.startedAt || rate <= 0) {
    session.minutes = 0;
    session.price = 0;
    return true;
  }

  const end = session.endedAt ? new Date(session.endedAt) : new Date();
  const ranMs = Math.max(0, end.getTime() - new Date(session.startedAt).getTime());
  let { minutes, amount } = chargeForDuration(ranMs, rate);

  // The clock should already have stopped at the ceiling; this is the belt to
  // that braces, in case a session sat active past its `endsAt` unnoticed.
  const cap = Number(session.maxMinutes) || 0;
  if (cap > 0 && minutes > cap) {
    minutes = cap;
    amount = minutes * rate;
  }

  const note = (who) => `${minutes} min ${session.type || 'chat'} consultation with ${who}`;

  // Debit the full amount if it's there; otherwise sweep what remains.
  let charged = amount;
  const debited = amount > 0
    ? await User.findOneAndUpdate(
      { _id: session.userId, walletBalance: { $gte: amount } },
      {
        $inc: { walletBalance: -amount },
        $push: { walletTransactions: { type: 'debit', amount, note: note(session.advocateName) } },
      }
    ).lean()
    : null;

  if (amount > 0 && !debited) {
    const wallet = await User.findById(session.userId).select('walletBalance').lean();
    charged = Math.max(0, Math.min(amount, Number(wallet?.walletBalance) || 0));
    if (charged > 0) {
      await User.updateOne(
        { _id: session.userId },
        {
          $inc: { walletBalance: -charged },
          $push: { walletTransactions: { type: 'debit', amount: charged, note: note(session.advocateName) } },
        }
      );
    }
  }

  if (charged > 0) {
    await Advocate.findByIdAndUpdate(session.advocateId, {
      $inc: { walletBalance: charged },
      $push: { walletTransactions: { type: 'credit', amount: charged, note: note(session.userName) } },
    });
  }

  session.minutes = minutes;
  session.price = charged;
  return true;
}

/**
 * Flip an active-but-expired session to `ended` (lazy, on read), settle what it
 * cost, and close a call that outlived it or that nobody ever picked up.
 */
async function settleIfExpired(session) {
  if (!session) return session;
  let dirty = false;

  if (session.status === 'active' && session.endsAt && new Date(session.endsAt) <= new Date()) {
    // Ran to the ceiling the wallet could afford.
    session.status = 'ended';
    session.endedAt = session.endsAt;
    dirty = true;
  }

  // Any session that is over and unpaid gets settled here, whoever noticed it.
  if (session.status === 'ended' && !session.settled) {
    dirty = (await settleCharges(session)) || dirty;
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
  // Leftover time this session still has free to reconnect (0 if none / spent /
  // expired), so the account can show "X min left · resume free".
  const leftMs = isResumable(r) ? leftoverMs(r) : 0;

  return {
    id: String(r._id),
    userId: String(r.userId),
    userName: r.userName || 'Client',
    advocateId: String(r.advocateId),
    advocateName: r.advocateName || 'Lawyer',
    rate: r.rate || 0,
    // Billed minutes and amount — what the session actually came to.
    minutes: r.minutes || 0,
    price: r.price || 0,
    // 'chat' | 'video' | 'audio' — history and the resume board group by it.
    type: r.type || 'chat',
    status: r.status,
    // Money only moves once a session is over and settled, so a live one has
    // not cost anything yet — it is still accruing.
    charged: Boolean(r.settled) && (r.price || 0) > 0,
    // A free reconnection of earlier leftover time (price 0, no wallet charge).
    isResume: Boolean(r.resumedFromId),
    // Unused time still claimable from this session, and when that offer lapses.
    resumeLeftoverSeconds: Math.floor(leftMs / 1000),
    resumeExpiresAt: leftMs ? new Date(new Date(r.endedAt).getTime() + RESUME_WINDOW_MS).toISOString() : null,
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

/**
 * Create a pending consultation request. No charge — the rate is only
 * recorded here, along with the ceiling the user's wallet can cover, and the
 * bill is worked out when the session ends.
 */
export async function createConsultation({
  userId, userName, advocateId, advocateName, rate, maxMinutes, type = 'chat',
}) {
  await connectDB();
  const doc = await Consultation.create({
    userId, userName, advocateId, advocateName,
    rate, maxMinutes, type, status: 'pending',
  });
  return serializeSession(doc.toObject());
}

/**
 * The user's leftover time with a given lawyer, if any is free to reconnect
 * right now — or `null`. Powers the "Resume · Free" button on the profile.
 */
export async function getResumableSession(userId, advocateId, type) {
  await connectDB();
  // Only a handful of recent ended sessions matter — settle any that just
  // expired so their leftover reads correctly, then take the newest resumable.
  //
  // `type` keeps each channel's leftover to itself: unused phone minutes come
  // back as a phone call, not as a chat window.
  const docs = await Consultation.find({
    userId, advocateId, status: { $in: ['active', 'ended'] }, resumed: false,
    // Chat is the default, and `$in: [..., null]` also matches the rows saved
    // before `type` existed — those were all chats.
    type: type === 'audio' || type === 'video' ? type : { $in: ['chat', null] },
  })
    .sort({ endedAt: -1, createdAt: -1 })
    .limit(5);
  const settled = await Promise.all(docs.map((d) => settleIfExpired(d)));

  const found = settled.find((s) => isResumable(s));
  if (!found) return null;

  const ms = leftoverMs(found);
  return {
    id: String(found._id),
    leftoverMs: ms,
    leftoverSeconds: Math.floor(ms / 1000),
    // When the free window closes — 24h after the session ended.
    expiresAt: new Date(new Date(found.endedAt).getTime() + RESUME_WINDOW_MS).toISOString(),
  };
}

/**
 * Start a free reconnection that spends a paid session's leftover time. Creates
 * a pending, zero-price session the lawyer still has to accept — the parent's
 * leftover is only marked spent once that acceptance goes through (see
 * `acceptConsultation`), so a declined resume leaves the time intact.
 */
export async function resumeConsultation({ userId, userName, advocateId, advocateName, fromId }) {
  await connectDB();
  const parent = await Consultation.findOne({ _id: fromId, userId, advocateId });
  if (!parent) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
  await settleIfExpired(parent);
  if (!isResumable(parent)) { const e = new Error('Not resumable'); e.code = 'BAD_STATE'; throw e; }

  // If a resume off this session is already waiting for the lawyer, reuse it
  // rather than stacking a second pending request.
  const existing = await Consultation.findOne({ resumedFromId: parent._id, status: 'pending' });
  if (existing) return serializeSession(existing.toObject());

  const doc = await Consultation.create({
    userId,
    userName,
    advocateId,
    advocateName,
    minutes: leftoverMs(parent) / 60000, // fractional; endsAt math handles it
    price: 0,
    status: 'pending',
    // Leftover time comes back the way it was bought — phone minutes resume as
    // a phone call, not as a chat window.
    type: parent.type || 'chat',
    resumedFromId: parent._id,
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
 * Lawyer accepts: start the clock. Nothing is charged here.
 *
 * The wallet is touched once, at the end, for the minutes that actually ran —
 * so a lawyer who accepts and finds the client has gone costs them the one
 * minimum minute rather than a full block. `endsAt` is the point the wallet
 * runs dry, which is where the session cuts off on its own.
 *
 * The balance is re-checked here because it may have been spent between
 * booking and acceptance; the affordable ceiling is recomputed from what is
 * there now rather than what was there then.
 */
export async function acceptConsultation(id, advocateId) {
  await connectDB();
  const session = await Consultation.findOne({ _id: id, advocateId });
  if (!session) { const e = new Error('Not found'); e.code = 'NOT_FOUND'; throw e; }
  if (session.status !== 'pending') { const e = new Error('Already handled'); e.code = 'BAD_STATE'; throw e; }

  const rate = Number(session.rate) || 0;
  if (rate > 0) {
    const wallet = await User.findById(session.userId).select('walletBalance').lean();
    const affordable = Math.floor((Number(wallet?.walletBalance) || 0) / rate);
    if (affordable < 1) { const e = new Error('Insufficient balance'); e.code = 'INSUFFICIENT'; throw e; }
    session.maxMinutes = affordable;
  }

  const startedAt = new Date();
  session.status = 'active';
  session.startedAt = startedAt;
  session.endsAt = new Date(startedAt.getTime() + (session.maxMinutes || 0) * 60 * 1000);
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

/**
 * Either participant ends an active session — which is also where it is paid
 * for. The bill is the minutes between accept and this moment, so hanging up
 * early genuinely costs less.
 */
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
    closeCall(session, 'hangup');
    await settleCharges(session);
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
