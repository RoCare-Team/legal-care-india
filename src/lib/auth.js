import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

/**
 * Authentication helpers: password hashing, JWT signing/verification and
 * the httpOnly session cookie used to identify the logged-in advocate.
 */
export const AUTH_COOKIE = 'lci_token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set in .env.local');
  return s;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, secret(), { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, secret());
  } catch {
    return null;
  }
}

/** Cookie options shared by set/clear. */
function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

/** Attach the session cookie to a NextResponse. */
export function setAuthCookie(response, token) {
  response.cookies.set(AUTH_COOKIE, token, cookieOptions(MAX_AGE));
  return response;
}

/** Remove the session cookie from a NextResponse. */
export function clearAuthCookie(response) {
  response.cookies.set(AUTH_COOKIE, '', cookieOptions(0));
  return response;
}

/** Reset OTPs live for 10 minutes; allow at most 5 wrong guesses. */
export const RESET_OTP_TTL_MS = 10 * 60 * 1000;
export const RESET_OTP_MAX_ATTEMPTS = 5;

/**
 * Create a 6-digit password-reset OTP. Returns the raw OTP (sent to the user by
 * SMS/email) and its SHA-256 hash (stored in the DB — the raw OTP is never
 * persisted).
 */
export function createOtp() {
  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const otpHash = hashOtp(otp);
  const expires = new Date(Date.now() + RESET_OTP_TTL_MS);
  return { otp, otpHash, expires };
}

/** SHA-256 hash of an OTP, used to verify it without storing it raw. */
export function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

/**
 * Read the decoded session from the request cookie, or null.
 * Returns `{ id, role }`. Tokens issued before roles existed have no `role`,
 * so a missing role is treated as 'advocate' for backward compatibility.
 */
export async function getSession() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.id) return null;
  return { id: payload.id, role: payload.role || 'advocate' };
}

/** Current advocate id, or null if not signed in as an advocate. */
export async function getSessionAdvocateId() {
  const session = await getSession();
  return session && session.role === 'advocate' ? session.id : null;
}

/** Current user id, or null if not signed in as a user. */
export async function getSessionUserId() {
  const session = await getSession();
  return session && session.role === 'user' ? session.id : null;
}
