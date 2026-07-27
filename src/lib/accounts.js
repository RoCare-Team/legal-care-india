import Advocate from '@/models/Advocate';
import User from '@/models/User';

/**
 * The two account types and the rule that one email may hold only one of them.
 *
 * Lawyers and clients live in separate collections, and `unique: true` only
 * applies within a collection — so nothing stopped the same email registering
 * as both, each with its own password. That is not a theoretical problem: it
 * already happened, and it made a client's password reset silently change a
 * lawyer's password instead.
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

/** The model for the *other* role — the one an email must not also be in. */
export function otherAccountModel(role) {
  return normalizeRole(role) === 'user' ? Advocate : User;
}

/**
 * Is this email already registered under the opposite account type?
 *
 * @param {string} email    normalised (trimmed, lowercased)
 * @param {'user'|'advocate'} role  the type being signed up for
 * @returns {Promise<'user'|'advocate'|null>} the conflicting role, or null
 */
export async function findEmailConflict(email, role) {
  const taken = await otherAccountModel(role).exists({ email });
  if (!taken) return null;
  return normalizeRole(role) === 'user' ? 'advocate' : 'user';
}

/** The message shown when an email is already held by the other account type. */
export function emailConflictMessage(conflictRole) {
  return conflictRole === 'advocate'
    ? 'This email is already registered as a lawyer account. Log in as a lawyer, or use a different email address.'
    : 'This email is already registered as a client account. Log in there, or use a different email address.';
}
