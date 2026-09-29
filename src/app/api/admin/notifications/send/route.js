import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getAdminSession } from '@/lib/admin';
import { NOTIFICATION_TYPES, TOPICS, isAllowedRoute, sendNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

const RESERVED = new Set(['type', 'route', 'url', 'imageUrl', 'notificationId']);
const isHttps = (v) => /^https:\/\/[^\s]+$/i.test(String(v || ''));

/** 22:00–08:00 India time — no marketing pushes then. */
function quietHoursIST(now = new Date()) {
  const h = new Date(now.getTime() + 330 * 60 * 1000).getUTCHours();
  return h >= 22 || h < 8;
}

/**
 * POST /api/admin/notifications/send — a push sent by hand. Admin only.
 *
 * {
 *   type: 'message' | 'offer' | 'festival' | 'announcement' | 'blog',
 *   title (≤ 65), body (≤ 240), imageUrl? (https), route? | url? (not both),
 *   data?: { string: string },
 *   target: { kind: 'topic', topic } | { kind: 'users', userIds } | { kind: 'role', role } | { kind: 'token', token },
 *   ttlSeconds?, collapseKey?, dryRun?, ignoreQuietHours?
 * }
 * → 200 { notificationId, target, successCount, failureCount, removedTokens, fcmMessageIds }
 *
 * Offers, festivals and blogs are marketing: they are refused between 10 pm
 * and 8 am IST unless `ignoreQuietHours` is set (a test to one token or the
 * `test` topic is always allowed).
 */
export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  let b;
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const bad = (error) => NextResponse.json({ error }, { status: 400 });

  const type = String(b?.type || '');
  const spec = NOTIFICATION_TYPES[type];
  if (!spec?.admin) {
    return bad(`Unknown type. Use one of: ${Object.keys(NOTIFICATION_TYPES).filter((t) => NOTIFICATION_TYPES[t].admin).join(', ')}.`);
  }

  const title = String(b.title || '').trim();
  const body = String(b.body || '').trim();
  if (!title || !body) return bad('Title and body are required.');
  if (title.length > 65) return bad('Title must be 65 characters or fewer.');
  if (body.length > 240) return bad('Body must be 240 characters or fewer.');

  const imageUrl = b.imageUrl ? String(b.imageUrl).trim() : '';
  if (imageUrl && !isHttps(imageUrl)) return bad('imageUrl must be a public https URL.');

  const route = b.route ? String(b.route).trim() : '';
  const url = b.url ? String(b.url).trim() : '';
  if (route && url) return bad('Send either route or url, not both.');
  if (route && !isAllowedRoute(route)) return bad(`Route "${route}" is not one the app can open.`);
  if (url && !isHttps(url)) return bad('url must be an https link.');

  const data = b.data && typeof b.data === 'object' && !Array.isArray(b.data) ? b.data : {};
  for (const [k, v] of Object.entries(data)) {
    if (RESERVED.has(k)) return bad(`data may not contain the reserved key "${k}".`);
    if (typeof v !== 'string') return bad(`data.${k} must be a string.`);
  }
  if (type === 'blog' && !route && !data.slug) return bad('A blog push needs data.slug or a route.');

  const t = b.target || {};
  let target;
  if (t.kind === 'topic' && TOPICS.includes(t.topic)) target = { kind: 'topic', topic: t.topic };
  else if (t.kind === 'role' && ['client', 'lawyer'].includes(t.role)) target = { kind: 'role', role: t.role };
  else if (t.kind === 'token' && String(t.token || '').trim()) target = { kind: 'token', token: String(t.token).trim() };
  else if (t.kind === 'users' && Array.isArray(t.userIds)) {
    const ids = [...new Set(t.userIds.map(String))].filter((id) => mongoose.isValidObjectId(id));
    if (!ids.length) return bad('target.userIds has no valid ids.');
    if (ids.length > 1000) return bad('At most 1000 userIds per send.');
    target = { kind: 'users', userIds: ids };
  } else {
    return bad(`target must be { kind: "topic", topic: ${TOPICS.join('|')} }, { kind: "users", userIds }, { kind: "role", role: client|lawyer } or { kind: "token", token }.`);
  }

  const isTest = target.kind === 'token' || (target.kind === 'topic' && target.topic === 'test');
  if (spec.marketing && !isTest && !b.dryRun && !b.ignoreQuietHours && quietHoursIST()) {
    return bad('Offers, festivals and blogs are not sent between 10 pm and 8 am IST. Schedule it for the morning, or set ignoreQuietHours.');
  }

  try {
    const result = await sendNotification({
      type,
      title,
      body,
      imageUrl,
      route,
      url,
      data,
      target,
      ttlSeconds: b.ttlSeconds,
      collapseKey: b.collapseKey ? String(b.collapseKey).slice(0, 60) : '',
      dryRun: Boolean(b.dryRun),
      sentBy: admin.email || 'admin',
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Could not send.', notificationId: err.notificationId, ...(err.result || {}) },
      { status: 502 }
    );
  }
}
