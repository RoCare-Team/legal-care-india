import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Enquiry from '@/models/Enquiry';
import { getSessionAdvocateId } from '@/lib/auth';
import { ENQUIRY_STATUSES } from '@/constants/enquiryStatus';

/**
 * PATCH /api/enquiries/[id]  { status }
 * The lawyer updates the status of an enquiry addressed to them. Only the
 * lawyer who owns the enquiry may change it.
 */
export async function PATCH(request, { params }) {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const status = String(body?.status || '').trim();
  if (!ENQUIRY_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  try {
    await connectDB();
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
    }
    // Ownership check — a lawyer can only touch their own enquiries.
    if (String(enquiry.advocateId) !== String(advocateId)) {
      return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });
    }

    enquiry.status = status;
    await enquiry.save();

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error('update enquiry status error', err);
    return NextResponse.json({ error: 'Could not update status.' }, { status: 500 });
  }
}
