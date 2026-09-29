import mongoose from 'mongoose';
import { after } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { connectDB } from '@/lib/db';
import DeviceToken from '@/models/DeviceToken';
import Advocate from '@/models/Advocate';
import NotificationLog from '@/models/NotificationLog';

/**
 * Push notifications to the app — every kind, to anyone.
 *
 * Every push carries a `type` (which Android channel it rings on and what the
 * app does with it) and, where it leads somewhere, a `route` (the app screen a
 * tap opens). The app only opens routes on its allowed list, so this module
 * refuses any other route before it is ever sent. The contract with the app is
 * the "Justice Land push notification spec" handed over with the Flutter build.
 *
 * Nothing here may break the thing a push rides on: automatic pushes go
 * through notifyClient / notifyLawyer, which never throw.
 */

/* ── Firebase ───────────────────────────────────────────────────────────── */

/**
 * The admin SDK, created once. Credentials are FIREBASE_SERVICE_ACCOUNT — the
 * whole service-account JSON as one string — so it works the same on a
 * serverless deploy as locally. Missing or broken, this returns null and
 * pushes are simply not sent, rather than every caller failing.
 */
export function firebaseMessaging() {
  if (getApps().length) return getMessaging(getApps()[0]);
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    return getMessaging(initializeApp({ credential: cert(JSON.parse(raw)) }));
  } catch (err) {
    console.error('push: could not initialise Firebase Admin', err.message);
    return null;
  }
}

const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

/* ── Types, channels, routes ────────────────────────────────────────────── */

const DAY = 24 * 60 * 60;

/**
 * Every notification type the app understands.
 *   channel  — Android channel id (the app creates these)
 *   priority — 'high' only for calls, requests, chat and consultation updates
 *   ttl      — seconds before an undelivered push is dropped
 *   route    — the screen a tap opens when the sender gives none
 *   admin    — may be sent by hand from the admin API
 */
export const NOTIFICATION_TYPES = {
  incoming_call: { channel: 'consultation_calls', priority: 'high', ttl: 30, dataOnly: true },
  call_cancelled: { channel: '', priority: 'high', ttl: 30, dataOnly: true },
  consultation_request: { channel: 'consultation_requests', priority: 'high', ttl: 5 * 60, route: () => '/lawyer' },
  consultation_update: {
    channel: 'general', priority: 'high', ttl: DAY,
    route: (d) => (d.consultationId ? `/consultation/${d.consultationId}/chat` : '/consultations'),
  },
  chat_message: {
    channel: 'general', priority: 'high', ttl: DAY,
    route: (d) => (d.consultationId ? `/consultation/${d.consultationId}/chat` : '/consultations'),
  },
  order_update: { channel: 'general', priority: 'normal', ttl: DAY, route: () => '/orders' },
  wallet: { channel: 'general', priority: 'normal', ttl: DAY, route: () => '/wallet' },
  lawyer_account: {
    channel: 'general', priority: 'normal', ttl: DAY,
    route: (d) => ({ plan_expiring: '/lawyer/plan', payout: '/lawyer/earnings' }[d.reason] || '/lawyer/profile'),
  },
  message: { channel: 'general', priority: 'normal', ttl: DAY, route: () => '/', admin: true },
  offer: { channel: 'offers', priority: 'normal', ttl: DAY, route: () => '/services/all', admin: true, marketing: true },
  festival: { channel: 'offers', priority: 'normal', ttl: DAY, route: () => '/', admin: true, marketing: true },
  announcement: { channel: 'general', priority: 'normal', ttl: DAY, route: () => '/', admin: true },
  blog: {
    channel: 'offers', priority: 'normal', ttl: DAY,
    route: (d) => (d.slug ? `/blogs/${d.slug}` : '/blogs'), admin: true, marketing: true,
  },
};

/** The only routes the app will open — anything else is refused here. */
const ALLOWED_ROUTES = [
  /^\/$/,
  /^\/lawyers$/, /^\/lawyers\/[^/?#\s]+$/,
  /^\/services$/, /^\/services\/all$/, /^\/services\/[^/?#\s]+$/,
  /^\/consultations$/, /^\/consultation\/[^/?#\s]+\/chat$/,
  /^\/orders$/, /^\/wallet$/, /^\/saved$/, /^\/profile$/,
  /^\/blogs$/, /^\/blogs\/[^/?#\s]+$/,
  /^\/lawyer$/, /^\/lawyer\/requests(\?tab=missed)?$/,
  /^\/lawyer\/(consultations|queries|earnings|plan|profile)$/,
];

export function isAllowedRoute(route) {
  return ALLOWED_ROUTES.some((rx) => rx.test(String(route || '')));
}

export const TOPICS = ['all', 'clients', 'lawyers', 'test'];

export function newNotificationId() {
  return `ntf_${new mongoose.Types.ObjectId().toString()}`;
}

/** Everything in an FCM `data` block has to be a string. */
function stringData(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)])
  );
}

/**
 * The FCM message (without its target) for one push, in the shape the app
 * expects — format A (plain), B (with image) or, for the two call types, C
 * (data-only, no `notification` block, so Android hands it to the app's
 * full-screen call code instead of drawing a banner itself).
 */
export function buildMessage({
  type, title = '', body = '', imageUrl = '', route = '', url = '', data = {},
  notificationId, tag = '', collapseKey = '', ttlSeconds,
}) {
  const spec = NOTIFICATION_TYPES[type];
  if (!spec) throw new Error(`Unknown notification type: ${type}`);
  const finalRoute = url ? '' : route || spec.route?.(data) || '';
  const ttl = Math.min(28 * DAY, Math.max(0, Number(ttlSeconds) || spec.ttl)) * 1000;

  const payload = stringData({
    ...data,
    type,
    route: finalRoute,
    url,
    imageUrl,
    notificationId,
  });

  if (spec.dataOnly) {
    return { data: payload, android: { priority: 'high', ttl } };
  }

  return {
    notification: { title, body, ...(imageUrl ? { imageUrl } : {}) },
    data: payload,
    android: {
      priority: spec.priority,
      ttl,
      ...(collapseKey ? { collapseKey } : {}),
      notification: {
        channelId: spec.channel,
        ...(tag ? { tag } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      },
    },
    apns: {
      payload: { aps: { sound: 'default', ...(imageUrl ? { 'mutable-content': 1 } : {}) } },
      ...(imageUrl ? { fcmOptions: { imageUrl } } : {}),
    },
  };
}

/* ── Tokens ─────────────────────────────────────────────────────────────── */

/**
 * Every token for these accounts. Lawyers are also read from the older
 * Advocate.fcmTokens list, which the previous app build still writes to.
 */
export async function tokensFor({ ownerIds = [], role } = {}) {
  await connectDB();
  const ids = ownerIds.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(String(id)));
  const filter = {};
  if (ids.length) filter.ownerId = { $in: ids };
  if (role) filter.role = role;
  if (!ids.length && !role) return [];

  const rows = await DeviceToken.find(filter).select('token').lean();
  const tokens = new Set(rows.map((r) => r.token));

  if (role === 'lawyer' || (!role && ids.length)) {
    const legacy = await Advocate.find(ids.length ? { _id: { $in: ids } } : { 'fcmTokens.0': { $exists: true } })
      .select('fcmTokens')
      .lean();
    for (const a of legacy) for (const t of a.fcmTokens || []) if (t) tokens.add(t);
  }
  return [...tokens];
}

/** Forget tokens Firebase says are dead, wherever they are stored. */
async function dropDeadTokens(dead) {
  if (!dead.length) return;
  await Promise.all([
    DeviceToken.deleteMany({ token: { $in: dead } }),
    Advocate.updateMany({ fcmTokens: { $in: dead } }, { $pullAll: { fcmTokens: dead } }),
  ]);
}

/**
 * One message to many devices, 500 at a time (Firebase's limit), dropping the
 * tokens Firebase reports dead.
 */
export async function sendToTokens(tokens, message, { dryRun = false } = {}) {
  const out = { successCount: 0, failureCount: 0, removedTokens: 0, fcmMessageIds: [] };
  const fcm = firebaseMessaging();
  if (!fcm || !tokens.length) return out;

  const dead = [];
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const res = await fcm.sendEachForMulticast({ ...message, tokens: batch }, dryRun);
    out.successCount += res.successCount;
    out.failureCount += res.failureCount;
    res.responses.forEach((r, j) => {
      if (r.success) out.fcmMessageIds.push(r.messageId);
      else if (DEAD_TOKEN_CODES.has(r.error?.code)) dead.push(batch[j]);
      else console.error('push:', r.error?.code, r.error?.message);
    });
  }
  if (!dryRun) {
    await dropDeadTokens(dead);
    out.removedTokens = dead.length;
  }
  return out;
}

/* ── Sending ────────────────────────────────────────────────────────────── */

/**
 * Send one notification to a target and log it.
 *
 * target:
 *   { kind: 'topic', topic }             — all | clients | lawyers | test
 *   { kind: 'users', userIds: [...] }    — any accounts, clients or lawyers
 *   { kind: 'role', role }               — every stored client / lawyer token
 *   { kind: 'token', token }             — one device, for testing
 *   { kind: 'client', id } / { kind: 'lawyer', id } — one account (events)
 *
 * @returns {Promise<object>} { notificationId, target, successCount, failureCount, removedTokens, fcmMessageIds }
 */
export async function sendNotification({ target, sentBy = 'event', dryRun = false, ...payload }) {
  const notificationId = payload.notificationId || newNotificationId();
  const message = buildMessage({ ...payload, notificationId });
  let result = { successCount: 0, failureCount: 0, removedTokens: 0, fcmMessageIds: [] };
  let error = '';

  try {
    const fcm = firebaseMessaging();
    if (!fcm) throw new Error('Firebase is not configured (FIREBASE_SERVICE_ACCOUNT).');

    if (target.kind === 'topic') {
      const id = await fcm.send({ ...message, topic: target.topic }, dryRun);
      result = { ...result, successCount: 1, fcmMessageIds: [id] };
    } else if (target.kind === 'token') {
      try {
        const id = await fcm.send({ ...message, token: target.token }, dryRun);
        result = { ...result, successCount: 1, fcmMessageIds: [id] };
      } catch (err) {
        result.failureCount = 1;
        if (!dryRun && DEAD_TOKEN_CODES.has(err.code)) {
          await dropDeadTokens([target.token]);
          result.removedTokens = 1;
        }
        throw err;
      }
    } else {
      const tokens =
        target.kind === 'users' ? await tokensFor({ ownerIds: target.userIds })
          : target.kind === 'role' ? await tokensFor({ role: target.role })
            : target.kind === 'client' ? await tokensFor({ ownerIds: [target.id], role: 'client' })
              : target.kind === 'lawyer' ? await tokensFor({ ownerIds: [target.id], role: 'lawyer' })
                : [];
      result = await sendToTokens(tokens, message, { dryRun });
    }
  } catch (err) {
    error = err.message || String(err);
    if (sentBy !== 'event') throw Object.assign(err, { notificationId, result });
    console.error('push: send failed', payload.type, error);
  } finally {
    try {
      await connectDB();
      await NotificationLog.create({
        notificationId,
        type: payload.type,
        title: payload.title || '',
        body: payload.body || '',
        imageUrl: payload.imageUrl || '',
        route: message.data?.route || '',
        target,
        successCount: result.successCount,
        failureCount: result.failureCount,
        removedTokens: result.removedTokens,
        dryRun,
        sentBy,
        error,
      });
    } catch (logErr) {
      console.error('push: could not log send', logErr.message);
    }
  }

  return { notificationId, target, ...result };
}

/**
 * Run a push after the response has gone out. On Vercel a function can be
 * frozen the moment it responds, and a push started but not awaited would go
 * with it; `after` keeps the function alive until the push is done. Outside a
 * request (a script, a cron) there is nothing to wait for, so it just runs.
 */
function inBackground(task) {
  const run = () => task().catch((err) => console.error('push:', err.message));
  try {
    after(run);
  } catch {
    run();
  }
}

/** An automatic push to a client's devices. Never throws, never delays the caller. */
export function notifyClient(userId, payload) {
  inBackground(() => sendNotification({ ...payload, target: { kind: 'client', id: String(userId) } }));
}

/** An automatic push to a lawyer's devices. Never throws, never delays the caller. */
export function notifyLawyer(advocateId, payload) {
  inBackground(() => sendNotification({ ...payload, target: { kind: 'lawyer', id: String(advocateId) } }));
}
