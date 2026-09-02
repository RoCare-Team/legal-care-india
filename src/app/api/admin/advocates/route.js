import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { ADVOCATES_TAG } from '@/lib/advocates';

/**
 * What each action writes. Two separate things live here and they are not the
 * same decision, however often they are made together:
 *
 *   approve / unpublish  — `status`, which is whether the lawyer is in the
 *                          public directory at all.
 *   verify / unverify    — `verified`, the badge beside their name. It is a
 *                          claim that someone checked their credentials, so it
 *                          stays a separate act from letting them be listed.
 */
const ACTIONS = {
  approve: { set: { status: 'published' }, notYet: { status: { $ne: 'published' } } },
  unpublish: { set: { status: 'pending' }, notYet: { status: { $ne: 'pending' } } },
  verify: { set: { verified: true }, notYet: { verified: { $ne: true } } },
  // Not `{ $ne: false }`: that also matches a record from before the field
  // existed, and counting those as "changed" would report work never done.
  unverify: { set: { verified: false }, notYet: { verified: true } },
};

/**
 * PATCH /api/admin/advocates
 *   { id, action }   — one lawyer
 *   { ids, action }  — many, in a single write
 *
 * `action` is one of approve, unpublish, verify, unverify. Admin-only.
 *
 * The bulk form exists because approving a directory one row at a time is a
 * request per lawyer and a page refresh after each: fine for the fifteenth
 * registration, not for a launch. It is `updateMany`, so either the whole
 * selection changes or none of it does, and the cache is dropped once at the
 * end rather than once per lawyer.
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

  // One id or many — the same handler, so the two forms cannot drift apart.
  const ids = [...new Set(
    (Array.isArray(body?.ids) ? body.ids : [body?.id])
      .map((value) => String(value || '').trim())
      .filter(Boolean)
  )];
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Missing lawyer.' }, { status: 400 });
  }

  const action = String(body?.action || '').trim();
  const update = ACTIONS[action];
  if (!update) return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });

  try {
    await connectDB();

    // Counted before the write, because afterwards it cannot be. The schema
    // stamps `updatedAt` on every save, so Mongo reports every matched
    // document as modified whether or not its status or badge actually moved —
    // "15 updated" when fourteen were already published is a lie the panel
    // would tell every time.
    const changed = await Advocate.countDocuments({
      _id: { $in: ids },
      ...update.notYet,
    });

    const result = await Advocate.updateMany({ _id: { $in: ids } }, { $set: update.set });
    if (!result.matchedCount) {
      return NextResponse.json({ error: 'Lawyer not found.' }, { status: 404 });
    }

    // The public directory changed — drop the cached list and the pages that
    // show lawyers so the change is visible immediately. Once for the whole
    // batch: revalidating per lawyer would rebuild the same pages N times.
    revalidateTag(ADVOCATES_TAG);
    revalidatePath('/');
    revalidatePath('/lawyers');

    return NextResponse.json({ ok: true, matched: result.matchedCount, changed });
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
