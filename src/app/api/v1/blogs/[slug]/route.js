import { NextResponse } from 'next/server';
import { apiGetBlog, apiUpdateBlog, apiDeleteBlog } from '@/lib/blogWrite';

export const dynamic = 'force-dynamic';

/**
 * One article, by slug. Open, like /api/v1/blogs — no API key.
 *
 * GET    /api/v1/blogs/<slug>                → { blog }
 * PATCH  /api/v1/blogs/<slug>  { any field } → { blog }   (slug never changes)
 * DELETE /api/v1/blogs/<slug>                → { ok }
 */

function errorResponse(err) {
  if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error('v1 blog', err);
  return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
}

export async function GET(request, { params }) {
  const { slug } = await params;
  try {
    return NextResponse.json({ blog: await apiGetBlog(slug) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request, { params }) {
  const { slug } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send a JSON body with Content-Type: application/json.' }, { status: 400 });
  }
  try {
    return NextResponse.json({ ok: true, blog: await apiUpdateBlog(slug, body) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request, { params }) {
  const { slug } = await params;
  try {
    return NextResponse.json({ ok: true, ...(await apiDeleteBlog(slug)) });
  } catch (err) {
    return errorResponse(err);
  }
}
