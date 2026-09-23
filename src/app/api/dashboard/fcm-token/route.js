import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { getSessionAdvocateId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST/DELETE /api/dashboard/fcm-token   { token }
 *
 * Registers (or removes) this device's Firebase Cloud Messaging token against
 * the signed-in lawyer, so a push can reach them later. Called by the app on
 * sign-in and whenever Firebase rotates the token; removed on sign-out, so a
 * phone that has moved on to a different lawyer's account does not keep
 * ringing for the one that used to be signed in on it.
 *
 * `$addToSet`/`$pull` rather than a plain array write: two devices, or the
 * same device registering twice after a token refresh, must not collide or
 * duplicate the same address in the list.
 */
export async function POST(request) {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const token = String(body?.token || '').trim();
  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 });

  await connectDB();
  await Advocate.updateOne({ _id: id }, { $addToSet: { fcmTokens: token } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let body = {};
  try {
    body = await request.json();
  } catch {
    // A sign-out that cannot describe its own token still deserves to sign
    // out — this only skips the cleanup, not the response.
  }

  const token = String(body?.token || '').trim();
  await connectDB();
  if (token) {
    await Advocate.updateOne({ _id: id }, { $pull: { fcmTokens: token } });
  }
  return NextResponse.json({ ok: true });
}
