import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { createApiKey, listApiKeys, revokeApiKey } from '@/lib/apiKeys';

export const dynamic = 'force-dynamic';

/**
 * Admin-only management of API keys for the outside write API.
 *
 * GET    /api/admin/api-keys?scope=blogs  → { keys }
 * POST   /api/admin/api-keys  { name, scope? }  → { key, apiKey }  (key shown once)
 * DELETE /api/admin/api-keys?id=…  → revoke
 */
export async function GET(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  const scope = new URL(request.url).searchParams.get('scope') || 'blogs';
  return NextResponse.json({ keys: await listApiKeys(scope) });
}

export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  try {
    const result = await createApiKey({ name: body?.name, scope: 'blogs', createdBy: admin.email || 'admin' });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('create api key', err);
    return NextResponse.json({ error: 'Could not create the key.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id') || '';
  const ok = await revokeApiKey(id);
  if (!ok) return NextResponse.json({ error: 'Key not found or already revoked.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
