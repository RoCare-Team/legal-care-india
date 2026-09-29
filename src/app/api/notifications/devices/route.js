import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import DeviceToken from '@/models/DeviceToken';
import Advocate from '@/models/Advocate';

export const dynamic = 'force-dynamic';

const PLATFORMS = ['android', 'ios', 'web', 'other'];
const clip = (v, n) => String(v ?? '').trim().slice(0, n);

/** The signed-in account, as { id, role: 'client' | 'lawyer' }, or null. */
async function owner() {
  const session = await getSession();
  if (!session?.id || !mongoose.isValidObjectId(session.id)) return null;
  return { id: session.id, role: session.role === 'user' ? 'client' : 'lawyer' };
}

async function readBody(request) {
  try {
    return (await request.json()) || {};
  } catch {
    return {};
  }
}

/**
 * POST /api/notifications/devices
 *   { token, platform: 'android' | 'ios', appVersion, deviceId?, locale? }
 *   → 200 { ok: true }
 *
 * Registers this phone for pushes, for a signed-in client or lawyer (the same
 * cookie session as the rest of the app). Upserts on `token`: if the phone
 * was last signed in as someone else, the token moves to this account, so it
 * stops receiving the previous account's notifications. Called on sign-in, on
 * every app start and whenever Firebase rotates the token.
 */
export async function POST(request) {
  const who = await owner();
  if (!who) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const body = await readBody(request);
  const token = clip(body.token, 4096);
  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 });
  const platform = PLATFORMS.includes(body.platform) ? body.platform : 'other';

  await connectDB();
  await DeviceToken.updateOne(
    { token },
    {
      $set: {
        ownerId: new mongoose.Types.ObjectId(who.id),
        role: who.role,
        platform,
        appVersion: clip(body.appVersion, 40),
        deviceId: clip(body.deviceId, 200),
        locale: clip(body.locale, 20),
        lastSeenAt: new Date(),
      },
    },
    { upsert: true }
  );
  // The same phone may still sit on another lawyer's legacy list from the
  // older fcm-token route; it belongs to this account now.
  await Advocate.updateMany(
    { fcmTokens: token, ...(who.role === 'lawyer' ? { _id: { $ne: who.id } } : {}) },
    { $pull: { fcmTokens: token } }
  );

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/notifications/devices   { token }  → 200 { ok: true }
 *
 * Called on sign-out: this phone stops receiving this account's pushes.
 * Answers ok even when the token is unknown or the session has already
 * expired — a sign-out must never fail because of cleanup.
 */
export async function DELETE(request) {
  const body = await readBody(request);
  const token = clip(body.token, 4096);
  if (!token) return NextResponse.json({ ok: true });

  const who = await owner();
  await connectDB();
  // Signed in: only this account's row. Session already gone: the token alone
  // is enough — whoever holds it is the phone that is signing out.
  await DeviceToken.deleteOne(who ? { token, ownerId: who.id } : { token });
  await Advocate.updateMany({ fcmTokens: token }, { $pull: { fcmTokens: token } });
  return NextResponse.json({ ok: true });
}
