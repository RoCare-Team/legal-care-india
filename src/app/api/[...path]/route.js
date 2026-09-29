import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * /api/<anything that is not a real route> → 404 JSON.
 *
 * Without this, an unknown /api path fell through to the site's page routes
 * (the [slug] and [slug]/[sub] city pages) and came back as a 200 HTML page.
 * The app then got HTML where it expected JSON, and a route that simply was
 * not deployed yet looked like it had answered. A catch-all has the lowest
 * priority of any route, so every real /api route still wins.
 */
function notFound(request) {
  const { pathname } = new URL(request.url);
  return NextResponse.json(
    { error: 'Not found.', path: pathname },
    { status: 404, headers: { 'Cache-Control': 'no-store' } }
  );
}

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
export const HEAD = notFound;
export const OPTIONS = notFound;
