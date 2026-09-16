import crypto from 'crypto';

/**
 * Server-to-server access to the account delete endpoints, for a developer or
 * system outside the admin panel (no browser, so no admin cookie).
 *
 * The key lives in ACCOUNT_DELETE_API_KEY and is sent as either
 *   x-api-key: <key>
 *   Authorization: Bearer <key>
 *
 * It opens exactly two endpoints — DELETE /api/admin/users and
 * DELETE /api/admin/advocates — and nothing else in the admin API. With the
 * variable unset, or set to something shorter than 32 characters, the key path
 * is off entirely, so a forgotten or weak value cannot become an open door.
 */
const MIN_KEY_LENGTH = 32;

export function hasDeleteApiKey(request) {
  const expected = process.env.ACCOUNT_DELETE_API_KEY || '';
  if (expected.length < MIN_KEY_LENGTH) return false;

  const header = request.headers.get('x-api-key') || '';
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const given = header || bearer;
  if (!given) return false;

  // Hash both sides so the comparison is constant-time whatever the lengths.
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}
