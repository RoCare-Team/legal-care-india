import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';

/**
 * POST /api/contact  { name, email, subject, message }
 *
 * Saves a message from the public contact form for the admin panel to work
 * through. Open to anyone — that is what a contact form is — so the validation
 * here is the only thing standing between the form and the inbox.
 *
 * The reply address is whatever the sender typed; it is never trusted as an
 * identity, only stored so the admin has somewhere to write back to.
 */
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = String(body?.name || '').trim();
  const email = String(body?.email || '').trim();
  const subject = String(body?.subject || '').trim();
  const message = String(body?.message || '').trim();

  if (name.length < 2) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json(
      { error: 'Please write at least a sentence so we can help.' },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    await ContactMessage.create({
      // Sliced to the schema's limits rather than rejected: someone who wrote a
      // long message should not lose it to a validation error on submit.
      name: name.slice(0, 120),
      email: email.slice(0, 160),
      subject: subject.slice(0, 200),
      message: message.slice(0, 5000),
    });

    return NextResponse.json({
      ok: true,
      message: 'Thanks for writing in. We usually reply within one working day.',
    });
  } catch (err) {
    console.error('contact message error', err);
    return NextResponse.json(
      { error: 'Could not send your message. Please try again.' },
      { status: 500 }
    );
  }
}
