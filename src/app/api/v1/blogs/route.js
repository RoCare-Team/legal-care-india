import { NextResponse } from 'next/server';
import { apiListBlogs, apiCreateBlog } from '@/lib/blogWrite';

export const dynamic = 'force-dynamic';

/**
 * The blog write API, for outside tools. Open — no API key or login.
 *
 * GET  /api/v1/blogs[?published=true|false]   → { blogs }
 * POST /api/v1/blogs  { title, content, excerpt?, category?, coverImage?,
 *                       published? = true, slug? }        → 201 { blog }
 *
 * `content` is plain text: a blank line between paragraphs, "## " starts a
 * heading. No HTML.
 */

function errorResponse(err) {
  if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error('v1 blogs', err);
  return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
}

export async function GET(request) {
  const p = new URL(request.url).searchParams.get('published');
  try {
    const blogs = await apiListBlogs({ published: p === 'true' ? true : p === 'false' ? false : undefined });
    return NextResponse.json({ blogs, total: blogs.length });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Send a JSON body with Content-Type: application/json.' }, { status: 400 });
  }
  try {
    const blog = await apiCreateBlog(body);
    return NextResponse.json({ ok: true, blog }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
