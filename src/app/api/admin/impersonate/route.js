import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import { signToken, setAuthCookie, clearAuthCookie } from '@/lib/auth';
import Advocate from '@/models/Advocate';
import User from '@/models/User';

/**
 * Admin impersonation — "open this account".
 *
 * POST issues a normal session cookie for the target account, flagged `imp` so
 * the app can show an exit banner. The admin cookie is deliberately left in
 * place: it is a separate cookie, so the admin can drop back into /admin
 * without logging in again.
 *
 * DELETE ends the impersonated session (the admin cookie is untouched).
 */
export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const id = String(body?.id || '').trim();
  const role = body?.role === 'user' ? 'user' : 'advocate';
  if (!id) {
    return NextResponse.json({ error: 'Missing account id.' }, { status: 400 });
  }

  await connectDB();

  // Confirm the account still exists before minting a token for it.
  let target;
  try {
    const Model = role === 'user' ? User : Advocate;
    target = await Model.findById(id).select('name').lean();
  } catch {
    return NextResponse.json({ error: 'Invalid account id.' }, { status: 400 });
  }
  if (!target) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const redirectTo = role === 'user' ? '/account' : '/dashboard';
  const token = signToken({ id, role, imp: true });

  return setAuthCookie(
    NextResponse.json({ ok: true, redirectTo, name: target.name || '' }),
    token
  );
}

export async function DELETE() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }
  return clearAuthCookie(NextResponse.json({ ok: true }));
}
