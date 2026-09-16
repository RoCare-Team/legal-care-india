import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getAdminSession } from '@/lib/admin';
import { hasDeleteApiKey } from '@/lib/deleteApiKey';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

/**
 * DELETE /api/admin/users?id=xyz — permanently remove a client account.
 * Admin session, or the account-delete API key (see lib/deleteApiKey).
 *
 * Only the User record goes. Their consultations, phone calls, enquiries and
 * testimonials stay, exactly as deleting a lawyer leaves their history behind:
 * those rows are the platform's own record of what happened and snapshot the
 * names they need, so the panel keeps reading correctly without them.
 */
export async function DELETE(request) {
  const admin = await getAdminSession();
  const byKey = !admin && hasDeleteApiKey(request);
  if (!admin && !byKey) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const id = String(new URL(request.url).searchParams.get('id') || '').trim();
  if (!id) return NextResponse.json({ error: 'Missing user.' }, { status: 400 });
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 });
  }

  try {
    await connectDB();
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    console.warn(`[delete] user ${id} (${deleted.phone || ''}) deleted by ${byKey ? 'API key' : admin.email || 'admin'}`);
    return NextResponse.json({ ok: true, deleted: { type: 'user', id } });
  } catch (err) {
    console.error('user delete error', err);
    return NextResponse.json({ error: 'Could not delete the user. Please try again.' }, { status: 500 });
  }
}
