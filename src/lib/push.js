import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';

/**
 * Push notifications to a lawyer's phone — a new request, or a call ringing —
 * so both reach them whether the app is open, backgrounded, or not running at
 * all. This is the one thing the in-app poll (LawyerController) cannot do on
 * its own: it only runs while the app is alive to run it.
 *
 * A failed push is never allowed to fail the booking or the call it rides on
 * — every call here is wrapped so the worst a broken push can do is not
 * arrive. The in-app poll is still the source of truth the moment the app is
 * open; this only covers the gap before that.
 */

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

/**
 * Sends one notification to every device a lawyer has registered, and drops
 * whichever tokens Firebase reports as dead (uninstalled, signed out of,
 * expired) so the list does not grow forever with addresses nothing is at.
 *
 * @param {string} advocateId
 * @param {{ title: string, body: string, data?: Record<string,string> }} message
 *   `data` values must be strings — that is what FCM's data payload accepts,
 *   and it is what the app reads to decide where a tap should open.
 */
export async function sendPushToAdvocate(advocateId, { title, body, data = {} }) {
  const fcm = messaging();
  if (!fcm) return;

  try {
    await connectDB();
    const advocate = await Advocate.findById(advocateId).select('fcmTokens').lean();
    const tokens = (advocate?.fcmTokens || []).filter(Boolean);
    if (tokens.length === 0) return;

    const res = await fcm.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: {
        // Wakes the device and shows now, not batched with the OS's usual
        // delivery window — a client waiting for a lawyer to pick up cannot
        // wait for Android's convenience.
        priority: 'high',
        notification: { channelId: 'consultations', sound: 'default' },
      },
    });

    const dead = [];
    res.responses.forEach((r, i) => {
      if (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code)) {
        dead.push(tokens[i]);
      }
    });
    if (dead.length) {
      await Advocate.updateOne({ _id: advocateId }, { $pullAll: { fcmTokens: dead } });
    }
  } catch (err) {
    // Never let a push failure ripple into the booking or call it rides on.
    console.error('push: sendPushToAdvocate failed', err);
  }
}
