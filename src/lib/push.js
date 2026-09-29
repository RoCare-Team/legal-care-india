import { tokensFor, sendToTokens } from '@/lib/notifications';

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
 * Sends one message to every device a lawyer has registered — through the
 * devices API or the older fcm-token route — dropping the tokens Firebase
 * reports as dead. See lib/notifications for the shared plumbing.
 */
async function sendToAdvocate(advocateId, message) {
  try {
    const tokens = await tokensFor({ ownerIds: [String(advocateId)], role: 'lawyer' });
    await sendToTokens(tokens, message);
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
    data: { type: 'consultation_request', route: '/lawyer', consultationId: id, callType: 'chat' },
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
