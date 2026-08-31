import { NextResponse } from 'next/server';
import { getAllBlogs } from '@/lib/blogs';

/**
 * GET /api/blogs — published articles, newest first.
 *
 * `getAllBlogs` is the read /blogs itself uses, so an article an admin hides
 * disappears from the app at the same moment it disappears from the website —
 * the hidden-slug filter lives in that function, not in either caller.
 *
 * Query: category, page, perPage
 */
export const revalidate = 300;

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 50;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get('category') || '').trim();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number(searchParams.get('perPage')) || DEFAULT_PER_PAGE)
  );

  try {
    const all = await getAllBlogs();
    const rows = category ? all.filter((b) => (b.category || '') === category) : all;
    const start = (page - 1) * perPage;

    return NextResponse.json({
      blogs: rows.slice(start, start + perPage),
      total: rows.length,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(rows.length / perPage)),
    });
  } catch (err) {
    console.error('GET /api/blogs', err);
    return NextResponse.json({ error: 'Could not load articles.' }, { status: 500 });
  }
}
