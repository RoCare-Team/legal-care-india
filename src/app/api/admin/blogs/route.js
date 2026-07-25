import { NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import Blog from '@/models/Blog';
import { BLOGS_TAG, readingMinutes } from '@/lib/blogs';
import { BLOGS as STATIC_BLOGS } from '@/data/blogs';
import { slugify } from '@/utils/slugify';

/** Drop the cached article list and re-render the pages that show articles. */
function revalidateBlogs(slug) {
  revalidateTag(BLOGS_TAG);
  revalidatePath('/blogs');
  if (slug) revalidatePath(`/blogs/${slug}`);
}

/** Read + validate the fields a post is written from. */
function readFields(body) {
  return {
    title: String(body?.title || '').trim(),
    excerpt: String(body?.excerpt || '').trim(),
    category: String(body?.category || '').trim() || 'Legal Guide',
    content: String(body?.content || '').trim(),
    coverImage: String(body?.coverImage || '').trim(),
    published: body?.published !== false,
  };
}

/**
 * POST /api/admin/blogs  { title, excerpt, category, content, coverImage, published }
 * Admin-only. Writes a new article; its URL slug comes from the title.
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

  const fields = readFields(body);
  if (fields.title.length < 4) {
    return NextResponse.json({ error: 'Please enter the article title.' }, { status: 400 });
  }
  if (fields.content.length < 20) {
    return NextResponse.json({ error: 'Please write the article content.' }, { status: 400 });
  }

  const slug = slugify(fields.title);
  if (!slug) {
    return NextResponse.json({ error: 'Could not build a URL from that title.' }, { status: 400 });
  }
  // A built-in post owns its slug in code, so a DB row with the same one would
  // never be the article that /blogs/[slug] serves.
  if (STATIC_BLOGS.some((b) => b.slug === slug)) {
    return NextResponse.json({ error: 'An article with that title already exists.' }, { status: 409 });
  }

  try {
    await connectDB();
    if (await Blog.exists({ slug })) {
      return NextResponse.json({ error: 'An article with that title already exists.' }, { status: 409 });
    }

    await Blog.create({ ...fields, slug, readMinutes: readingMinutes(fields.content) });
    revalidateBlogs(slug);

    return NextResponse.json({
      ok: true,
      slug,
      message: fields.published ? 'Article published.' : 'Draft saved.',
    });
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'An article with that title already exists.' }, { status: 409 });
    }
    console.error('add blog error', err);
    return NextResponse.json({ error: 'Could not save the article. Please try again.' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/blogs  { id, ...fields }
 * Admin-only. Edits an article, or just flips it between published and draft
 * when only `published` is sent. The slug is left alone — changing it would
 * break every link already pointing at the article.
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

  const id = String(body?.id || '').trim();
  if (!id) return NextResponse.json({ error: 'Missing article.' }, { status: 400 });

  const update = {};
  // Publish/unpublish on its own, from the row's switch.
  if (Object.keys(body).length === 2 && typeof body.published === 'boolean') {
    update.published = body.published;
  } else {
    const fields = readFields(body);
    if (fields.title.length < 4) {
      return NextResponse.json({ error: 'Please enter the article title.' }, { status: 400 });
    }
    if (fields.content.length < 20) {
      return NextResponse.json({ error: 'Please write the article content.' }, { status: 400 });
    }
    Object.assign(update, fields, { readMinutes: readingMinutes(fields.content) });
  }

  try {
    await connectDB();
    const post = await Blog.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!post) return NextResponse.json({ error: 'Article not found.' }, { status: 404 });

    revalidateBlogs(post.slug);
    return NextResponse.json({ ok: true, message: 'Article updated.' });
  } catch (err) {
    console.error('update blog error', err);
    return NextResponse.json({ error: 'Could not update the article.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/blogs?id=xyz — remove an admin-written article.
 * (Built-in posts live in code and can't be deleted here.)
 */
export async function DELETE(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing article.' }, { status: 400 });

  try {
    await connectDB();
    const post = await Blog.findByIdAndDelete(id).lean();
    if (!post) {
      return NextResponse.json(
        { error: 'Article not found (built-in posts can\'t be removed).' },
        { status: 404 }
      );
    }
    revalidateBlogs(post.slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('delete blog error', err);
    return NextResponse.json({ error: 'Could not delete the article.' }, { status: 500 });
  }
}
