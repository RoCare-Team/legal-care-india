import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createQuery } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * POST /api/queries — anyone, signed in or not, posts a legal question.
 *
 * No account is needed: the point of the pool is that somebody with a problem
 * can describe it and be called back. Throttling lives in lib/queries, keyed
 * on a hash of the caller's address and on the number given.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // Behind a proxy the real address is the first entry of X-Forwarded-For.
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || '';

  // Only used to link the question to an account when one happens to be signed
  // in; it is never required and the form never asks.
  const session = await getSession().catch(() => null);

  try {
    const result = await createQuery(body, {
      ip,
      userAgent: request.headers.get('user-agent') || '',
      userId: session?.role === 'user' ? session.id : '',
    });
    return NextResponse.json(
      {
        ok: true,
        id: result.id,
        message: 'Your question has been posted. A verified lawyer will call you shortly.',
      },
      { status: 201 }
    );
  } catch (err) {
    if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('create legal query', err);
    return NextResponse.json({ error: 'Could not post your question. Please try again.' }, { status: 500 });
  }
}
