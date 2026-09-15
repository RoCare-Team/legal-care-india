import { NextResponse } from 'next/server';

/**
 * A signed-in lawyer starts in their portal, not on the client-facing
 * shopfront. The home page and the lawyer listing are for people looking for a
 * lawyer; a lawyer landing there after logging in reads as having been sent to
 * the wrong app.
 *
 * Only the role is read, from the token's payload, without verifying the
 * signature — there is no Node crypto here, and nothing is granted by it: a
 * forged cookie can only redirect its own holder to /dashboard, where the
 * layout verifies the token properly. A stale token for a deleted account is
 * cleared there too (via /api/auth/logout), so this cannot loop.
 *
 * Done here rather than in the pages because both are statically rendered;
 * reading cookies inside them would make every visitor's request dynamic.
 */
function roleOf(token) {
  try {
    const part = token.split('.')[1];
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')));
    if (!payload?.id) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    // Tokens issued before roles existed are lawyers' (see getSession).
    return payload.role || 'advocate';
  } catch {
    return null;
  }
}

export function middleware(request) {
  const token = request.cookies.get('lci_token')?.value;
  if (token && roleOf(token) === 'advocate') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/lawyers'],
};
