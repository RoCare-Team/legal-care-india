import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import {
  getPaymentConfig,
  getPaymentConfigForAdmin,
  savePaymentConfig,
  keyMode,
} from '@/lib/paymentSettings';
import { testCredentials } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/**
 * Razorpay credentials, managed from /admin/payments.
 *
 * GET returns the key id and whether each secret is set — never a secret
 * itself. Once saved, a secret can only be replaced, not read back: an admin
 * session is a cookie, and a cookie should not be enough to walk away with the
 * key that signs payments.
 */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  try {
    return NextResponse.json(await getPaymentConfigForAdmin());
  } catch (err) {
    console.error('payment keys read failed', err);
    return NextResponse.json({ error: 'Could not read the payment settings.' }, { status: 500 });
  }
}

/**
 * PUT { keyId, keySecret?, webhookSecret? }
 *
 * A blank secret means "keep the saved one" — the form never holds the real
 * value, so it cannot send it back on an unrelated edit.
 *
 * The pair is proved against Razorpay BEFORE anything is written. Saving first
 * and checking after would mean a mistyped secret takes the site's payments
 * down until someone notices; this way a bad key is simply rejected and the
 * working configuration stays untouched.
 */
export async function PUT(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const keyId = String(body?.keyId || '').trim();
  const keySecret = String(body?.keySecret || '').trim();
  const webhookSecret = String(body?.webhookSecret || '').trim();

  if (!keyId) {
    return NextResponse.json({ error: 'Enter the Key ID.' }, { status: 400 });
  }
  if (keyMode(keyId) === 'unknown') {
    return NextResponse.json(
      { error: 'That does not look like a Razorpay Key ID — it should start with rzp_live_ or rzp_test_.' },
      { status: 400 }
    );
  }

  const stored = await getPaymentConfigForAdmin();

  // Saving a new key id without its matching secret would leave the two halves
  // from different key pairs, and every payment would fail verification.
  if (keyId !== stored.keyId && !keySecret) {
    return NextResponse.json(
      { error: 'Enter the Key Secret that belongs to this new Key ID.' },
      { status: 400 }
    );
  }
  if (!stored.hasKeySecret && !keySecret) {
    return NextResponse.json({ error: 'Enter the Key Secret.' }, { status: 400 });
  }

  // Blank secret → the one already in force stays in play, so the probe tests
  // exactly the pair that would end up live.
  const effectiveSecret = keySecret || (await getPaymentConfig()).keySecret;

  const probe = await testCredentials(keyId, effectiveSecret);
  if (!probe.ok && probe.unauthorized) {
    return NextResponse.json(
      {
        error: 'Razorpay rejected these credentials. Nothing was changed — check the Key ID and Secret and try again.',
      },
      { status: 400 }
    );
  }

  try {
    await savePaymentConfig({
      keyId,
      keySecret,
      webhookSecret,
      updatedBy: admin.email || '',
    });

    return NextResponse.json({
      ok: true,
      verified: probe.ok,
      // Not an error — the keys are saved. Razorpay was simply unreachable, so
      // we could not prove them, and the admin should know that.
      warning: probe.ok
        ? undefined
        : 'Keys saved, but Razorpay could not be reached to confirm them.',
      ...(await getPaymentConfigForAdmin()),
    });
  } catch (err) {
    console.error('payment keys save failed', err);
    return NextResponse.json({ error: 'Could not save the keys.' }, { status: 500 });
  }
}
