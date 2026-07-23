import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

/**
 * DELETE /api/admin/users?id=xyz — permanently remove a client account.
 * Admin-only.
 *
 * Only the User record goes. Their consultations, phone calls, enquiries and
 * testimonials stay, exactly as deleting a lawyer leaves their history behind:
 * those rows are the platform's own record of what happened and snapshot the
 * names they need, so the panel keeps reading correctly without them.
 */
export async function DELETE(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing user.' }, { status: 400 });

  try {
    await connectDB();
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('user delete error', err);
    return NextResponse.json({ error: 'Could not delete the user. Please try again.' }, { status: 500 });
  }
}
