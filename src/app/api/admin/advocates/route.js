import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { ADVOCATES_TAG } from '@/lib/advocates';
import { sendCampaign } from '@/lib/campaignMail';
import { advocateApprovedEmail } from '@/lib/emails/advocateApproved';

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

    // Read before the write, because afterwards it cannot be. The schema
    // stamps `updatedAt` on every save, so Mongo reports every matched
    // document as modified whether or not its status or badge actually moved —
    // "15 updated" when fourteen were already published is a lie the panel
    // would tell every time.
    //
    // The same query supplies the recipients: exactly the lawyers this action
    // is about to change, so re-approving someone already live cannot email
    // them a second time.
    const affected = await Advocate.find({ _id: { $in: ids }, ...update.notYet })
      .select('name email')
      .lean();
    const changed = affected.length;

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

    // Tell the newly published lawyers their profile is live. Only on approve,
    // and only to the ones that actually moved — this is the one action of the
    // four that changes something the recipient would want to hear about.
    //
    // A mail failure must not fail the approval: the lawyers ARE published by
    // this point, and reporting an error would invite the admin to click again
    // and mail everyone twice. It comes back as `email` instead, so the panel
    // can say the approval worked and the notice did not.
    let email = null;
    if (action === 'approve' && changed > 0) {
      const { subject, html } = advocateApprovedEmail();
      try {
        const result$ = await sendCampaign({
          name: `Profile approved — ${new Date().toISOString().slice(0, 10)}`,
          subject,
          html,
          contacts: affected.map((a) => ({ email: a.email, name: a.name })),
        });
        email = { sent: result$.sent, error: result$.skipped };
      } catch (err) {
        console.error('approval email failed', err);
        email = { sent: 0, error: 'Approved, but the notification email failed.' };
      }
    }

    return NextResponse.json({ ok: true, matched: result.matchedCount, changed, email });
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
