import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Enquiry from '@/models/Enquiry';
import Advocate from '@/models/Advocate';
import { getSession } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

/**
 * POST /api/enquiries
 * Body: { advocateId, name, phone, email?, preferredDate?, message }
 *
 * A signed-in user sends a consultation request to a lawyer. The enquiry is
 * stored against the lawyer's _id so it shows in their dashboard.
 * Only logged-in users may send enquiries (matches the profile contact gate).
 */
export async function POST(request) {
  // Must be signed in as a user (or lawyer) to send an enquiry.
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Please sign in to book a consultation.' },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const advocateId = String(body?.advocateId || '').trim();
  const name = String(body?.name || '').trim();
  const phone = String(body?.phone || '').trim();
  const email = String(body?.email || '').trim();
  const preferredDate = String(body?.preferredDate || '').trim();
  const message = String(body?.message || '').trim();

  if (!advocateId) {
    return NextResponse.json({ error: 'Missing lawyer.' }, { status: 400 });
  }
  if (name.length < 2) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }
  if (phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json(
      { error: 'Please describe your legal matter in a sentence or two.' },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Confirm the lawyer exists (and grab their name/LCI for the record).
    const advocate = await Advocate.findById(advocateId).select('name legalCareId').lean();
    if (!advocate) {
      return NextResponse.json({ error: 'Lawyer not found.' }, { status: 404 });
    }

    await Enquiry.create({
      advocateId,
      advocateLegalCareId: advocate.legalCareId || '',
      advocateName: advocate.name || '',
      userId: session.id,
      name: name.slice(0, 80),
      email: email.slice(0, 120),
      phone: phone.slice(0, 20),
      preferredDate: preferredDate.slice(0, 40),
      message: message.slice(0, 1000),
    });

    // Record it in the user's activity history (best-effort).
    if (session.role === 'user') {
      await logActivity({ userId: session.id, advocateId, type: 'booking' });
    }

    return NextResponse.json({
      ok: true,
      message: 'Your consultation request has been sent to the lawyer.',
    });
  } catch (err) {
    console.error('create enquiry error', err);
    return NextResponse.json(
      { error: 'Could not send your request. Please try again.' },
      { status: 500 }
    );
  }
}
