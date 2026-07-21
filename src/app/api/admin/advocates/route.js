import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { ADVOCATES_TAG } from '@/lib/advocates';

/**
 * PATCH /api/admin/advocates  { id, action: 'approve' | 'unpublish' }
 * Admin-only. Approving publishes a pending lawyer to the public directory;
 * unpublishing takes a live lawyer back offline.
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
  const action = String(body?.action || '').trim();
  if (!id) return NextResponse.json({ error: 'Missing lawyer.' }, { status: 400 });

  const status = action === 'approve' ? 'published' : action === 'unpublish' ? 'pending' : null;
  if (!status) return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });

  try {
    await connectDB();
    const updated = await Advocate.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).select('name status');
    if (!updated) return NextResponse.json({ error: 'Lawyer not found.' }, { status: 404 });

    // The public directory changed — drop the cached list and the pages that
    // show lawyers so the change is visible immediately.
    revalidateTag(ADVOCATES_TAG);
    revalidatePath('/');
    revalidatePath('/lawyers');

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (err) {
    console.error('advocate status update error', err);
    return NextResponse.json({ error: 'Could not update the lawyer. Please try again.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/advocates?id=xyz — permanently remove a lawyer's account
 * and listing from the platform. Admin-only.
 */
export async function DELETE(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing lawyer.' }, { status: 400 });

  try {
    await connectDB();
    const deleted = await Advocate.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Lawyer not found.' }, { status: 404 });

    // Lawyer removed from the public directory — refresh the cached list and
    // the pages that show lawyers.
    revalidateTag(ADVOCATES_TAG);
    revalidatePath('/');
    revalidatePath('/lawyers');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('advocate delete error', err);
    return NextResponse.json({ error: 'Could not delete the lawyer. Please try again.' }, { status: 500 });
  }
}
