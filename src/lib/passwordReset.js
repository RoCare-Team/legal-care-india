import Advocate from '@/models/Advocate';
import User from '@/models/User';

/**
 * Which kind of account a password reset is for.
 *
 * The two account types are separate collections, and one person may hold both
 * under the same email — several already do. So the reset flow can never guess
 * which one is meant: it has to be told, or it will silently change the wrong
 * account's password. That is exactly what happened while this flow searched
 * only Advocate, and a user reset ended up resetting a lawyer login.
 *
 * Server-only — importing this pulls in the Mongoose models.
 */

/** Coerce anything into a valid role. Unknown/missing means the lawyer flow. */
export function normalizeRole(raw) {
  return raw === 'user' ? 'user' : 'advocate';
}

/** The Mongoose model that owns accounts of this role. */
export function accountModel(role) {
  return normalizeRole(role) === 'user' ? User : Advocate;
}

/** How to describe the account in a message shown to the person resetting. */
export function roleLabel(role) {
  return normalizeRole(role) === 'user' ? 'account' : 'lawyer account';
}
