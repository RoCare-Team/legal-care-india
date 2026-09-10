import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getSessionUserId } from '@/lib/auth';
import { getUserById, setUserAnonymous } from '@/lib/users';

/**
 * PATCH /api/user/me — update the logged-in user's account preferences.
 *
 * Three things: the anonymity switch (hide my name from lawyers), the display
 * name, and the saved billing address. Name lives here because mobile-OTP
 * login creates an account without one — there is no sign-up form left to
 * collect it, so it is filled in afterwards, either right after the first
 * login or from the account page.
 *
 * The billing address is only the default that prefills a service checkout.
 * The address printed on an order is copied onto that order when it is placed,
 * so changing this one never rewrites an invoice already issued.
 */

/** The fields a billing address is made of, in the order a form shows them. */
const ADDRESS_FIELDS = [
  'name',
  'email',
  'phone',
  'line1',
  'line2',
  'city',
  'state',
  'pincode',
  'gstin',
];

export async function PATCH(request) {
  const id = await getSessionUserId();
  if (!id) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const hasAnonymous = typeof body?.anonymous === 'boolean';
  const hasName = typeof body?.name === 'string';
  const hasAddress = body?.billingAddress && typeof body.billingAddress === 'object';

  if (!hasAnonymous && !hasName && !hasAddress) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  try {
    let updated = null;

    if (hasName) {
      const name = body.name.trim().replace(/\s+/g, ' ');
      if (name.length < 2 || name.length > 60) {
        return NextResponse.json(
          { error: 'Enter your name (2–60 characters).' },
          { status: 400 }
        );
      }
      await connectDB();
      updated = await User.findByIdAndUpdate(id, { name }, { new: true });
      if (!updated) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    if (hasAddress) {
      const address = {};
      for (const key of ADDRESS_FIELDS) {
        address[key] = String(body.billingAddress[key] ?? '').trim().slice(0, 120);
      }

      // A pincode that is not six digits is a typo, and this address is what
      // the paperwork gets posted to. Empty is fine — the field is optional
      // until an order actually needs it.
      if (address.pincode && !/^\d{6}$/.test(address.pincode)) {
        return NextResponse.json({ error: 'Enter a valid 6-digit PIN code.' }, { status: 400 });
      }
      if (address.gstin) {
        address.gstin = address.gstin.toUpperCase();
        if (!/^[0-9A-Z]{15}$/.test(address.gstin)) {
          return NextResponse.json({ error: 'Enter a valid 15-character GSTIN.' }, { status: 400 });
        }
      }

      await connectDB();
      updated = await User.findByIdAndUpdate(id, { billingAddress: address }, { new: true });
      if (!updated) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    if (hasAnonymous) {
      updated = await setUserAnonymous(id, body.anonymous);
      if (!updated) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    // The whole account comes back, not just the fields that moved. A caller
    // holding a copy of the user — the mobile app does — can then swap it for
    // this one instead of re-fetching, and the flat fields stay alongside it
    // for the callers that were reading those before `user` existed.
    const user = await getUserById(id);

    return NextResponse.json({
      ok: true,
      user,
      name: user.name,
      anonymous: user.anonymous,
      billingAddress: user.billingAddress,
    });
  } catch (err) {
    console.error('user preference update error', err);
    return NextResponse.json({ error: 'Could not update your settings.' }, { status: 500 });
  }
}
