import jwt from 'jsonwebtoken';
import { normalizePhone } from '@/lib/loginOtp';

/**
 * The gap between proving a phone number and having an account.
 *
 * Signing in as a lawyer is two requests when the number is new: verify the
 * code, then send the name, email and city. Something has to carry "this
 * number was proved a moment ago" across that gap, and it cannot be the
 * request body — a client that can name its own phone number can create an
 * account on someone else's.
 *
 * So the verify route mints a short-lived signed token naming the number, and
 * the signup route will not create an account without one. The token is the
 * proof; the body is only the details.
 *
 * It is deliberately not the session cookie. A session says who you are, and
 * at this point nobody is anybody yet.
 */

/** Cookie holding the proof. Separate from `lci_token`, and short-lived. */
export const SIGNUP_COOKIE = 'lci_phone_ok';

/**
 * Long enough to type a name, an email and pick a city; short enough that a
 * shared or forgotten browser is not a standing invitation to register a
 * lawyer on that number.
 */
export const SIGNUP_TOKEN_TTL_SECONDS = 20 * 60;

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set in .env.local');
  return s;
}

/**
 * Mint the proof that `phone` answered a code just now.
 * @param {string} phone normalised 10-digit number
 */
export function signSignupToken(phone) {
  return jwt.sign({ phone, kind: 'advocate-signup' }, secret(), {
    expiresIn: SIGNUP_TOKEN_TTL_SECONDS,
  });
}

/**
 * The number a signup token vouches for, or '' if it vouches for nothing.
 *
 * `kind` is checked as well as the signature: a session token is signed with
 * the same secret, and without this check one could be presented here to
 * register an account for whatever number it happened to carry.
 */
export function readSignupToken(token) {
  if (!token) return '';
  try {
    const payload = jwt.verify(token, secret());
    if (payload?.kind !== 'advocate-signup') return '';
    return normalizePhone(payload.phone) || '';
  } catch {
    return '';
  }
}

/** Cookie options shared by set and clear, mirroring the session cookie's. */
function options(maxAge) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export function setSignupCookie(response, token) {
  response.cookies.set(SIGNUP_COOKIE, token, options(SIGNUP_TOKEN_TTL_SECONDS));
  return response;
}

export function clearSignupCookie(response) {
  response.cookies.set(SIGNUP_COOKIE, '', options(0));
  return response;
}
