import { NextResponse } from 'next/server';
import { PLATFORMS, getAppVersionSettings, decideUpdate } from '@/lib/appVersion';

export const dynamic = 'force-dynamic';

/**
 * GET /api/app/version?platform=android&build=11&version=10.0.2
 * Public, no sign-in. Called by the app on launch and on returning to the
 * foreground (at most every 30 minutes).
 *
 * → 200 { platform, update: 'none'|'optional'|'force', latestVersion,
 *         latestBuild, minSupportedBuild, title, message, storeUrl }
 *
 * The server decides `update` for the build it was given, so the rule lives in
 * one place (lib/appVersion). Cached for five minutes, by the phone and the
 * CDN, per exact query — every launch calls this. Errors are JSON and never
 * cached; the app fails open on them, so an outage never locks anyone out.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const platform = String(searchParams.get('platform') || '').toLowerCase();
  const buildRaw = searchParams.get('build');
  const build = Number(buildRaw);

  const noStore = { 'Cache-Control': 'no-store' };
  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: 'platform must be "android" or "ios".' }, { status: 400, headers: noStore });
  }
  if (buildRaw === null || buildRaw === '' || !Number.isInteger(build) || build < 0) {
    return NextResponse.json({ error: 'build must be the installed build number (a whole number).' }, { status: 400, headers: noStore });
  }

  try {
    const settings = await getAppVersionSettings(platform);
    return NextResponse.json(decideUpdate(settings, build), {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    });
  } catch (err) {
    console.error('GET /api/app/version', err);
    return NextResponse.json({ error: 'Version check unavailable.' }, { status: 503, headers: noStore });
  }
}
