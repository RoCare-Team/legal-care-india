import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import User from '@/models/User';
import { placeClickToCall, isDialerConfigured } from '@/lib/tataDialer';
import { logActivity } from '@/lib/activity';

/**
 * POST /api/call/click-to-call — connect the signed-in client to a lawyer over
 * the phone, through the Tata Smartflo dialler.
 *
 * The request carries only `advocateId`. Both phone numbers are read from the
 * database on the server; the client never supplies either one. That is the
 * whole point — a caller who can name both ends of the bridge can dial any two
 * strangers together at the account's expense, and can use the endpoint to
 * confirm whether a given number belongs to a lawyer here.
 *
 * The lawyer's phone rings first and the client is bridged in once the lawyer
 * answers, so the client is never left holding a ringing handset for a call
 * nobody picked up. The client's own number is offered as the caller ID so the
 * lawyer knows who is calling; see `tataDialer` for what Tata does with it.
 */

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

/** What the visitor is told, per failure code from the dialler. */
const MESSAGES = {
  'invalid-number': 'That number does not look like a valid Indian mobile.',
  'same-number':
    'This lawyer is listed with the same phone number as your account, so there is nobody to connect you to.',
  'not-configured': 'Phone calling is not available right now.',
  'auth-failed': 'Phone calling is temporarily unavailable.',
  timeout: 'The call could not be placed in time. Please try again.',
};

export async function POST(request) {
  // 1. Only a signed-in client may place a call.
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json(
      { error: 'Please sign in to call a lawyer.' },
      { status: 401, headers: NO_STORE }
    );
  }

  if (!isDialerConfigured()) {
    return NextResponse.json(
      { error: MESSAGES['not-configured'] },
      { status: 503, headers: NO_STORE }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400, headers: NO_STORE });
  }

  const advocateId = String(body?.advocateId || '').trim();
  if (!advocateId) {
    return NextResponse.json({ error: 'Missing lawyer.' }, { status: 400, headers: NO_STORE });
  }

  try {
    await connectDB();

    // 2. Resolve both numbers server-side, from records the caller cannot edit.
    const [user, advocate] = await Promise.all([
      User.findById(session.id).select('phone').lean(),
      Advocate.findById(advocateId).select('phone contact status').lean().catch(() => null),
    ]);

    if (!advocate || advocate.status !== 'published') {
      return NextResponse.json({ error: 'Lawyer not found.' }, { status: 404, headers: NO_STORE });
    }

    if (!user?.phone) {
      return NextResponse.json(
        { error: 'Add your mobile number in your account before calling.' },
        { status: 400, headers: NO_STORE }
      );
    }

    // The public contact number is what the lawyer chose to be reached on; the
    // login number is only the fallback for profiles that never set one.
    const advocateNumber = advocate.contact?.phone || advocate.phone;
    if (!advocateNumber) {
      return NextResponse.json(
        { error: 'This lawyer has not listed a phone number.' },
        { status: 409, headers: NO_STORE }
      );
    }

    // 3. Ring the lawyer first and bridge the client in only once the lawyer
    // has answered.
    //
    // No `callerId` here on purpose. Sending the client's own number so the
    // lawyer could see who was calling is what Smartflo answers with
    // "DID Selected is either disabled or Outbound calling is disabled" — it
    // only accepts a DID registered on the account. Passing it anyway just
    // buys a guaranteed rejection and a second round-trip before the fallback.
    const result = await placeClickToCall({
      agentNumber: advocateNumber,
      destinationNumber: user.phone,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: MESSAGES[result.error] || 'Could not place the call. Please try again.' },
        { status: result.error === 'invalid-number' ? 400 : 502, headers: NO_STORE }
      );
    }

    // Best-effort history entry — it already never throws.
    await logActivity({ userId: session.id, advocateId, type: 'call' });

    // Deliberately no numbers and no provider payload in the response: it would
    // hand the browser exactly what the server just took care to withhold.
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    console.error('click-to-call error', err);
    return NextResponse.json(
      { error: 'Could not place the call. Please try again.' },
      { status: 500, headers: NO_STORE }
    );
  }
}
