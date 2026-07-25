import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Advocate from '@/models/Advocate';
import { placeClickToCall, isDialerConfigured, checkCallOutcome } from '@/lib/tataDialer';

/** Both sides' phone numbers, straight from the database. */
async function numbersFor(userId, advocateId) {
  await connectDB();
  const [user, advocate] = await Promise.all([
    User.findById(userId).select('phone').lean(),
    Advocate.findById(advocateId).select('phone contact name').lean(),
  ]);
  return {
    // The public contact number is what the lawyer chose to be reached on; the
    // login number is only the fallback for profiles that never set one.
    advocateNumber: advocate?.contact?.phone || advocate?.phone || '',
    advocateName: advocate?.name || '',
    userNumber: user?.phone || '',
  };
}

/**
 * Where is this phone call up to? See `checkCallOutcome` — 'ringing' means we
 * don't know yet, which is not the same as declined and must never charge.
 *
 * @returns {Promise<{state: 'answered'|'ended'|'declined'|'ringing', seconds: number}>}
 */
export async function checkAudioCall({ userId, advocateId, since }) {
  const { advocateNumber, userNumber } = await numbersFor(userId, advocateId);
  if (!advocateNumber || !userNumber) return { state: 'ringing', seconds: 0 };
  return checkCallOutcome({ agentNumber: advocateNumber, clientNumber: userNumber, since });
}

/**
 * Bridge an audio consultation over the phone network.
 *
 * An audio session is a real phone call, not a browser one: Smartflo rings the
 * lawyer's handset first and joins the client once they answer. The lawyer
 * therefore needs no website, no accept screen and no browser open at all —
 * their phone simply rings, the way any other call reaches them.
 *
 * Both numbers are read from the database, never from the request: a caller who
 * could name both ends of the bridge could dial any two strangers together at
 * our expense.
 *
 * Never throws — every failure comes back as a code the caller turns into
 * wording, so a dialler outage can't take a booking down with it.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.advocateId
 * @returns {Promise<{ok: true} | {ok: false, status: number, error: string}>}
 */
export async function bridgeAudioCall({ userId, advocateId }) {
  if (!isDialerConfigured()) {
    return { ok: false, status: 503, error: 'Phone calling is not available right now.' };
  }

  const { advocateNumber, advocateName, userNumber } = await numbersFor(userId, advocateId);

  if (!advocateNumber) {
    return {
      ok: false,
      status: 400,
      error: `${advocateName || 'This lawyer'} has not listed a phone number.`,
    };
  }
  if (!userNumber) {
    return {
      ok: false,
      status: 400,
      error: 'Add your mobile number in your account — the call comes to your phone.',
    };
  }

  const result = await placeClickToCall({
    agentNumber: advocateNumber,     // the lawyer's phone rings first
    destinationNumber: userNumber,   // the client is joined once they answer
  });

  if (result.ok) return { ok: true };

  const MESSAGES = {
    'invalid-number': 'One of the phone numbers is not a valid Indian mobile.',
    'same-number': 'This lawyer is listed with the same number as your account.',
    timeout: 'The call could not be placed in time. Please try again.',
    'auth-failed': 'Phone calling is temporarily unavailable.',
  };
  return {
    ok: false,
    status: 502,
    error: MESSAGES[result.error] || 'Could not place the call. Please try again.',
  };
}
