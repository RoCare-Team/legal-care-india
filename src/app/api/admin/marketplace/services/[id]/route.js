import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import LegalService from '@/models/LegalService';
import ServiceOrder from '@/models/ServiceOrder';
import { readServiceFields } from '@/lib/legalServices';
import { slugify } from '@/utils/slugify';

export const dynamic = 'force-dynamic';

/** PATCH /api/admin/marketplace/services/[id] — edit one catalogue entry. */
export async function PATCH(request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = readServiceFields(body, { partial: true });
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const update = { ...parsed.values };

  // The slug moves only when it is deliberately changed. Re-deriving it from a
  // retitled service would break links already handed out and orders already
  // placed against the old one.
  if (body?.slug !== undefined) {
    const slug = slugify(String(body.slug).trim());
    if (!slug) return NextResponse.json({ error: 'That URL is not usable.' }, { status: 400 });
    update.slug = slug;
  }

  try {
    await connectDB();

    if (update.slug) {
      const clash = await LegalService.exists({ slug: update.slug, _id: { $ne: id } });
      if (clash) {
        return NextResponse.json(
          { error: 'Another service already uses that URL.' },
          { status: 409 }
        );
      }
    }

    const service = await LegalService.findByIdAndUpdate(id, update, { new: true });
    if (!service) return NextResponse.json({ error: 'Service not found.' }, { status: 404 });

    return NextResponse.json({
      ok: true,
      service: { ...service.toObject(), id: String(service._id) },
    });
  } catch (err) {
    console.error('admin legal service update error', err);
    return NextResponse.json({ error: 'Could not save that service.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/marketplace/services/[id]
 *
 * Only ever removes a service nobody has bought. Once there are orders against
 * it, deleting the row would leave those orders pointing at nothing — so the
 * service is deactivated instead, which takes it off the catalogue and leaves
 * every past invoice intact. The response says which of the two happened.
 */
export async function DELETE(request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const { id } = await params;

  try {
    await connectDB();

    const ordered = await ServiceOrder.exists({ serviceId: id });
    if (ordered) {
      const service = await LegalService.findByIdAndUpdate(
        id,
        { active: false },
        { new: true }
      );
      if (!service) return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
      return NextResponse.json({
        ok: true,
        deactivated: true,
        message: 'This service has orders against it, so it was withdrawn rather than deleted.',
      });
    }

    const removed = await LegalService.findByIdAndDelete(id);
    if (!removed) return NextResponse.json({ error: 'Service not found.' }, { status: 404 });

    return NextResponse.json({ ok: true, deleted: true });
  } catch (err) {
    console.error('admin legal service delete error', err);
    return NextResponse.json({ error: 'Could not remove that service.' }, { status: 500 });
  }
}
