import crypto from 'crypto';

/**
 * Legal Care India ID — a permanent, unique public identifier for every
 * lawyer (e.g. "LCI-8KQ9PM"). Generated with a CSPRNG.
 *
 * The alphabet excludes ambiguous characters (0/O, 1/I/L) so the ID is safe in
 * URLs and unambiguous when read aloud or typed. 32 symbols ^ 6 = ~1.07 billion
 * combinations, so collisions are rare — registration still verifies uniqueness
 * against the DB and retries, so it stays correct at any scale.
 */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 chars, no 0 O 1 I L
const LENGTH = 6;

export function generateLegalCareId() {
  const bytes = crypto.randomBytes(LENGTH);
  let code = '';
  for (let i = 0; i < LENGTH; i += 1) {
    // 256 is an exact multiple of 32, so `% 32` introduces no modulo bias.
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `LCI-${code}`;
}
