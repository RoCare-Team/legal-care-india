import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import ContactMessage from '@/models/ContactMessage';

/** The states a message can be moved between from the panel. */
const STATUSES = ['new', 'read', 'replied'];

/**
 * PATCH /api/admin/contacts  { id, status }
 * Admin-only. Moves a contact-form message between new / read / replied.
 */
export async function PATCH(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const id = String(body?.id || '').trim();
  const status = String(body?.status || '').trim();

  if (!id) return NextResponse.json({ error: 'Message id is required.' }, { status: 400 });
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Unknown status.' }, { status: 400 });
  }

  try {
    await connectDB();
    const updated = await ContactMessage.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    if (!updated) return NextResponse.json({ error: 'Message not found.' }, { status: 404 });

    revalidatePath('/admin/contacts');
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error('admin contact patch error', err);
    return NextResponse.json({ error: 'Could not update the message.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/contacts  { id }
 * Admin-only. Removes a message for good — used for spam.
 */
export async function DELETE(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const id = String(body?.id || '').trim();
  if (!id) return NextResponse.json({ error: 'Message id is required.' }, { status: 400 });

  try {
    await connectDB();
    const removed = await ContactMessage.findByIdAndDelete(id);
    if (!removed) return NextResponse.json({ error: 'Message not found.' }, { status: 404 });

    revalidatePath('/admin/contacts');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('admin contact delete error', err);
    return NextResponse.json({ error: 'Could not delete the message.' }, { status: 500 });
  }
}
