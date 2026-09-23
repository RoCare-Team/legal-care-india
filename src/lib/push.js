import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';

/**
 * Push notifications to a lawyer's phone for a new consultation request, and
 * for that request no longer needing an answer.
 *
 * Audio/video requests go out DATA-ONLY at high priority: the app turns them
 * into a full-screen incoming-call screen, the same way WhatsApp does. A push
 * that carries a `notification` block is drawn by Android itself as an
 * ordinary small notification and never reaches that code, so call pushes
 * must not have one. A chat request gets an ordinary notification instead —
 * there is no call screen for a chat to open.
 *
 * A failed push is never allowed to fail the booking or the call it rides on
 * — every call here is wrapped so the worst a broken push can do is not
 * arrive. The in-app poll (LawyerController) is still the source of truth the
 * moment the app is open; this only covers the gap before that.
 */

/** How long the app rings before a call is a missed one — FCM may drop a call push once it is this stale. */
const RING_MS = 60 * 1000;

/**
 * The admin SDK app, created once and reused. Credentials come from
 * FIREBASE_SERVICE_ACCOUNT — the whole service-account JSON, as one string —
 * rather than a file, so this works the same in a serverless deploy as it
 * does locally. Missing or malformed, this returns null rather than throwing:
 * a platform that has not set Firebase up yet should run with pushes simply
 * not sent, not with every booking failing because of them.
 */
function messaging() {
  if (getApps().length) return getMessaging(getApps()[0]);

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (err) {
    console.error('push: FIREBASE_SERVICE_ACCOUNT is not valid JSON', err.message);
    return null;
  }

  try {
    const app = initializeApp({ credential: cert(serviceAccount) });
    return getMessaging(app);
  } catch (err) {
    console.error('push: could not initialise Firebase Admin', err);
    return null;
  }
}

const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

/**
 * Sends one message to every device a lawyer has registered, and drops
 * whichever tokens Firebase reports as dead (uninstalled, signed out of,
 * expired) so the list does not grow forever with addresses nothing is at.
 */
async function sendToAdvocate(advocateId, message) {
  const fcm = messaging();
  if (!fcm) return;

  try {
    await connectDB();
    const advocate = await Advocate.findById(advocateId).select('fcmTokens').lean();
    const tokens = (advocate?.fcmTokens || []).filter(Boolean);
    if (tokens.length === 0) return;

    const res = await fcm.sendEachForMulticast({ ...message, tokens });

    const dead = [];
    res.responses.forEach((r, i) => {
      if (r.success) return;
      if (DEAD_TOKEN_CODES.has(r.error?.code)) dead.push(tokens[i]);
      else console.error('push:', r.error?.code, r.error?.message);
    });
    if (dead.length) {
      await Advocate.updateOne({ _id: advocateId }, { $pullAll: { fcmTokens: dead } });
    }
  } catch (err) {
    // Never let a push failure ripple into the booking or call it rides on.
    console.error('push: sendToAdvocate failed', err);
  }
}

/**
 * Low-level send, kept for callers that are not one of the two request-level
 * events below — currently the mid-session WebRTC ring in `startCall`/
 * `session.call` (a separate signalling layer from the consultation request
 * itself; see the handoff note in consultations.js next to its call site).
 */
export async function sendPushToAdvocate(advocateId, { title, body, data = {} }) {
  await sendToAdvocate(advocateId, {
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    android: { priority: 'high', notification: { channelId: 'consultation_requests', sound: 'default' } },
  });
}

const idOf = (c) => String(c._id ?? c.id);
const isCall = (c) => c.type === 'audio' || c.type === 'video';

/**
 * A client just created a request (status 'pending'). Audio/video rings the
 * lawyer's phone full-screen; chat is an ordinary notification.
 *
 * @param consultation the saved consultation ({ _id, advocateId, type, ... })
 * @param clientName   the name shown to the lawyer, e.g. 'Anonymous'
 */
export async function notifyNewRequest(consultation, clientName) {
  const id = idOf(consultation);
  const name = String(clientName || '').trim() || 'A client';

  if (isCall(consultation)) {
    const kind = consultation.type === 'video' ? 'video' : 'audio';
    await sendToAdvocate(consultation.advocateId, {
      // No `notification` block — see the module doc comment.
      data: {
        type: 'incoming_call',
        consultationId: id,
        callType: kind,
        callerName: name,
      },
      android: { priority: 'high', ttl: RING_MS },
      // iPhone: shows a normal notification (Android ignores this block).
      // Full-screen on iOS needs VoIP/PushKit, not built yet.
      apns: {
        headers: { 'apns-priority': '10', 'apns-push-type': 'alert' },
        payload: {
          aps: {
            alert: { title: `New ${kind} call request`, body: `${name} wants to talk.` },
            sound: 'default',
          },
        },
      },
    });
    return;
  }

  await sendToAdvocate(consultation.advocateId, {
    notification: { title: 'New chat request', body: `${name} wants to chat.` },
    data: { type: 'new_request', consultationId: id, callType: 'chat' },
    android: { priority: 'high', notification: { channelId: 'consultation_requests' } },
    apns: { payload: { aps: { sound: 'default' } } },
  });
}

/**
 * The request stopped ringing: the client cancelled it, or the lawyer
 * accepted or declined it — maybe on another device than the one showing the
 * call screen right now. No-op for a chat request, which never opened one.
 */
export async function notifyCallEnded(consultation) {
  if (!isCall(consultation)) return;
  await sendToAdvocate(consultation.advocateId, {
    data: { type: 'call_cancelled', consultationId: idOf(consultation) },
    android: { priority: 'high', ttl: RING_MS },
    apns: {
      headers: { 'apns-priority': '5', 'apns-push-type': 'background' },
      payload: { aps: { 'content-available': 1 } },
    },
  });
}
