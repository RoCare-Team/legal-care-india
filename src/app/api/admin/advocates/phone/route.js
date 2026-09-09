import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { ADVOCATES_TAG } from '@/lib/advocates';
import { normalizePhone } from '@/lib/loginOtp';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/advocates/phone  { id, phone }
 *
 * Changes the mobile number a lawyer's account belongs to. Admin only.
 *
 * This exists because signing in is a code sent to that number and nothing
 * else. There is no password to fall back on and no reset email, so a lawyer
 * whose stored number is wrong — mistyped at registration, or long since
 * changed — cannot get in by any route they control. Somebody has to be able
 * to correct it, or the account is gone.
 *
 * It is deliberately not part of the bulk PATCH endpoint. Those actions flip a
 * flag on a selection; this one moves an identity, one account at a time, and
 * mixing it in would make "apply to all selected" mean something dangerous.
 *
 * `phone` and `phoneNormalized` are written together. They must not drift:
 * the first is what clients see and the second is what the login looks up, so
 * changing one without the other either shows a number that cannot sign in or
 * lets a number sign in that nobody is told about.
 */
export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const id = String(body?.id || '').trim();
  const phone = normalizePhone(body?.phone);

  if (!id) return NextResponse.json({ error: 'Which lawyer?' }, { status: 400 });
  if (!phone) {
    return NextResponse.json(
      { error: 'Enter a valid 10-digit Indian mobile number.' },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const clash = await Advocate.findOne({ phoneNormalized: phone })
      .select('_id name legalCareId')
      .lean();
    if (clash && String(clash._id) !== id) {
      return NextResponse.json(
        {
          error: 'taken',
          message: `That number already belongs to ${clash.name} (${clash.legalCareId}).`,
        },
        { status: 409 }
      );
    }

    const result = await Advocate.updateOne(
      { _id: id },
      {
        $set: {
          phone,
          phoneNormalized: phone,
          // The contact number shown on the profile follows the login number,
          // which is what an admin correcting a wrong number means to fix.
          'contact.phone': phone,
          'contact.whatsapp': phone,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Lawyer not found.' }, { status: 404 });
    }

    revalidateTag(ADVOCATES_TAG);
    revalidatePath(`/admin/advocates/${id}`);

    console.warn(`[admin] ${admin.email || 'admin'} set login number for ${id} to ${phone}`);
    return NextResponse.json({ ok: true, phone });
  } catch (err) {
    console.error('admin phone change error', err);
    return NextResponse.json({ error: 'Could not save the number.' }, { status: 500 });
  }
}
