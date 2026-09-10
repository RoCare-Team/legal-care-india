import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import LegalService from '@/models/LegalService';
import { readServiceFields } from '@/lib/legalServices';
import { slugify } from '@/utils/slugify';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/marketplace/services — the whole catalogue, withdrawn ones too.
 *
 * The admin list is the one place a switched-off service has to stay visible;
 * hide it here and a service disabled by mistake could never be turned back on.
 */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  try {
    await connectDB();
    const services = await LegalService.find({}).sort({ sortOrder: 1, title: 1 }).lean();
    return NextResponse.json({
      services: services.map((s) => ({ ...s, _id: String(s._id), id: String(s._id) })),
    });
  } catch (err) {
    console.error('admin legal services list error', err);
    return NextResponse.json({ error: 'Could not load services.' }, { status: 500 });
  }
}

/** POST /api/admin/marketplace/services — add a service to the catalogue. */
export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = readServiceFields(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // Derived from the title unless one was typed. The slug is the address the
  // app caches against, so an admin should not have to invent one — but must
  // be able to keep an existing one when retitling.
  const slug = slugify(String(body?.slug || '').trim() || parsed.values.title);
  if (!slug) {
    return NextResponse.json(
      { error: 'Could not build a URL from that title.' },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    if (await LegalService.exists({ slug })) {
      return NextResponse.json(
        { error: 'A service with that URL already exists.' },
        { status: 409 }
      );
    }

    const created = await LegalService.create({ ...parsed.values, slug });
    return NextResponse.json({
      ok: true,
      service: { ...created.toObject(), id: String(created._id) },
    });
  } catch (err) {
    console.error('admin legal service create error', err);
    return NextResponse.json({ error: 'Could not save that service.' }, { status: 500 });
  }
}
