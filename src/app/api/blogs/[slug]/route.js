import { NextResponse } from 'next/server';
import { getBlogBySlug } from '@/lib/blogs';

/** GET /api/blogs/<slug> — one article, exactly as /blogs/<slug> renders it. */
export const revalidate = 300;

export async function GET(_request, { params }) {
  const { slug } = await params;
  try {
    const blog = await getBlogBySlug(String(slug || ''));
    if (!blog) return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    return NextResponse.json({ blog });
  } catch (err) {
    console.error('GET /api/blogs/[slug]', err);
    return NextResponse.json({ error: 'Could not load the article.' }, { status: 500 });
  }
}
