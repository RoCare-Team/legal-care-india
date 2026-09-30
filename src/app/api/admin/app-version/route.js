import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getAllAppVersionSettings, saveAppVersionSettings } from '@/lib/appVersion';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/app-version → { settings: [android, ios] }
 * PUT /api/admin/app-version
 *   { platform, latestVersion, latestBuild, minSupportedBuild,
 *     forceTitle, forceMessage, optionalTitle, optionalMessage, storeUrl }
 *   → { settings }  — 400 if minSupportedBuild > latestBuild
 *
 * Admin only. Turn force update on (minSupportedBuild > 0) only once the new
 * build is fully live in the store. The public check is cached for up to five
 * minutes, so a change reaches phones within that.
 */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  return NextResponse.json({ settings: await getAllAppVersionSettings() });
}

export async function PUT(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const settings = await saveAppVersionSettings(body, admin.email || 'admin');
    return NextResponse.json({ settings });
  } catch (err) {
    if (err.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('PUT /api/admin/app-version', err);
    return NextResponse.json({ error: 'Could not save.' }, { status: 500 });
  }
}
