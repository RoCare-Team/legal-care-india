import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

/**
 * POST /api/auth/logout — clears the session cookie.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  return clearAuthCookie(res);
}

/**
 * GET /api/auth/logout?next=/login — clears the cookie and sends them on.
 *
 * A GET exists for one situation the POST cannot cover: a page that has just
 * discovered the session points at an account that no longer exists. A server
 * component cannot clear a cookie while rendering, so it can only redirect —
 * and redirecting to a page that trusts the same dead cookie is how you get an
 * infinite loop and a blank screen. Sending them through here breaks the loop
 * by removing the thing causing it.
 *
 * `next` is same-site only. Logging out over a GET can be triggered by a third
 * party embedding the URL; that is an annoyance, not a breach, but sending the
 * visitor to an attacker's page afterwards would be worse than either.
 */
export async function GET(request) {
  const next = request.nextUrl.searchParams.get('next') || '/login';
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/login';
  const res = NextResponse.redirect(new URL(safe, request.nextUrl.origin));
  return clearAuthCookie(res);
}
