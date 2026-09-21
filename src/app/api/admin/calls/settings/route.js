import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getCallSettingsForAdmin, setCallingEnabled } from '@/lib/callSettings';

export const dynamic = 'force-dynamic';

/**
 * The phone dialler's on/off switch, managed from /admin/calls.
 *
 * GET returns the current state. PUT flips it — no credentials to manage here,
 * unlike the payment keys route this mirrors: the Smartflo token itself still
 * lives in .env, this only decides whether it's allowed to be used right now.
 */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  try {
    return NextResponse.json(await getCallSettingsForAdmin());
  } catch (err) {
    console.error('call settings read failed', err);
    return NextResponse.json({ error: 'Could not read the call settings.' }, { status: 500 });
  }
}

/** PUT { enabled: boolean } */
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
    const settings = await setCallingEnabled(Boolean(body?.enabled), admin.email || '');
    return NextResponse.json({ ok: true, ...settings });
  } catch (err) {
    console.error('call settings save failed', err);
    return NextResponse.json({ error: 'Could not save the setting.' }, { status: 500 });
  }
}
