import { NextResponse } from 'next/server';

/**
 * The response for an error thrown from lib/payouts: a validation or state
 * error carries its own status and message for the lawyer; anything else is
 * logged and reported as a plain 500.
 */
export function payoutErrorResponse(err, context) {
  if (err?.status) {
    return NextResponse.json({ error: err.message, code: err.code || undefined }, { status: err.status });
  }
  console.error(context, err);
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}
