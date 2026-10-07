import { NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/apiKeys';
import { apiGetBlog, apiUpdateBlog, apiDeleteBlog } from '@/lib/blogWrite';

export const dynamic = 'force-dynamic';

/**
 * One article, by slug. Same API key as /api/v1/blogs.
 *
 * GET    /api/v1/blogs/<slug>                → { blog }
 * PATCH  /api/v1/blogs/<slug>  { any field } → { blog }   (slug never changes)
 * DELETE /api/v1/blogs/<slug>                → { ok }
 */

const unauthorised = () =>
  NextResponse.json(
    { error: 'Missing or invalid API key. Send "Authorization: Bearer <key>" — keys are made in Admin → Blogs → Blog API.' },
    { status: 401 }
  );

function errorResponse(err) {
  if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error('v1 blog', err);
  return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
}

export async function GET(request, { params }) {
  if (!(await verifyApiKey(request, 'blogs'))) return unauthorised();
  const { slug } = await params;
  try {
    return NextResponse.json({ blog: await apiGetBlog(slug) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request, { params }) {
  if (!(await verifyApiKey(request, 'blogs'))) return unauthorised();
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
  if (!(await verifyApiKey(request, 'blogs'))) return unauthorised();
  const { slug } = await params;
  try {
    return NextResponse.json({ ok: true, ...(await apiDeleteBlog(slug)) });
  } catch (err) {
    return errorResponse(err);
  }
}
