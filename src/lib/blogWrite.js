import { revalidateTag, revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db';
import Blog from '@/models/Blog';
import HiddenBlog from '@/models/HiddenBlog';
import { BLOGS_TAG, readingMinutes } from '@/lib/blogs';
import { BLOGS as STATIC_BLOGS } from '@/data/blogs';
import { slugify } from '@/utils/slugify';
import { htmlToBlogText, htmlToPlainLine } from '@/utils/blogText';

/**
 * Writing articles from outside the admin panel — the /api/v1/blogs API.
 *
 * The same rules as the admin form: a title, real content, plain text with
 * "## " headings and blank lines between paragraphs, and a slug that never
 * changes once the article exists. HTML is accepted — most writing tools send
 * it — and converted to that plain format before it is stored (see
 * utils/blogText), so no markup ever reaches the page.
 */

function fail(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

/** Drop the cached article list and re-render the pages that show articles. */
function revalidateBlogs(slug) {
  revalidateTag(BLOGS_TAG);
  revalidatePath('/blogs');
  if (slug) revalidatePath(`/blogs/${slug}`);
}

/** An article as the API returns it. */
export function apiBlog(b) {
  return {
    id: String(b._id),
    slug: b.slug,
    url: `/blogs/${b.slug}`,
    title: b.title,
    excerpt: b.excerpt || '',
    category: b.category || '',
    content: b.content || '',
    coverImage: b.coverImage || '',
    readMinutes: b.readMinutes || 1,
    published: b.published !== false,
    createdAt: b.createdAt || null,
    updatedAt: b.updatedAt || null,
  };
}

/**
 * Validate the writable fields. `partial` allows leaving any out (PATCH);
 * whatever is sent is still checked.
 */
function readFields(body, { partial = false } = {}) {
  const out = {};
  const has = (k) => body && Object.prototype.hasOwnProperty.call(body, k);

  if (!partial || has('title')) {
    const title = htmlToPlainLine(String(body?.title || '')).trim();
    if (title.length < 4 || title.length > 200) throw fail('`title` must be 4–200 characters.');
    out.title = title;
  }
  if (!partial || has('content')) {
    const content = htmlToBlogText(String(body?.content || '')).trim();
    if (content.length < 20) throw fail('`content` must be at least 20 characters.');
    if (content.length > 100000) throw fail('`content` is over 100,000 characters.');
    out.content = content;
    out.readMinutes = readingMinutes(content);
  }
  if (!partial || has('excerpt')) out.excerpt = htmlToPlainLine(String(body?.excerpt || '')).trim().slice(0, 400);
  if (!partial || has('category')) out.category = String(body?.category || '').trim().slice(0, 60) || 'Legal Guide';
  if (!partial || has('coverImage')) {
    const url = String(body?.coverImage || '').trim();
    if (url && !/^https:\/\/\S+$/i.test(url)) throw fail('`coverImage` must be an https:// URL.');
    out.coverImage = url;
  }
  if (!partial || has('published')) {
    if (has('published') && typeof body.published !== 'boolean') throw fail('`published` must be true or false.');
    out.published = has('published') ? body.published : true;
  }
  return out;
}

/** Whether a slug is taken by a built-in article that is still showing. */
async function staticOwns(slug) {
  return STATIC_BLOGS.some((b) => b.slug === slug) && !(await HiddenBlog.exists({ slug }));
}

export async function apiListBlogs({ published } = {}) {
  await connectDB();
  const filter = published === undefined ? {} : { published };
  const rows = await Blog.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  return rows.map(apiBlog);
}

export async function apiGetBlog(slug) {
  await connectDB();
  const doc = await Blog.findOne({ slug: String(slug || '').toLowerCase() }).lean();
  if (!doc) throw fail('Article not found.', 404);
  return apiBlog(doc);
}

/** Create an article. The slug comes from `slug` if given, else the title. */
export async function apiCreateBlog(body) {
  const fields = readFields(body);
  const slug = slugify(String(body?.slug || '').trim() || fields.title).slice(0, 120);
  if (!slug) throw fail('Could not build a URL from that title — send a `slug`.');

  await connectDB();
  if ((await staticOwns(slug)) || (await Blog.exists({ slug }))) {
    throw fail(`An article with the slug "${slug}" already exists. Send a different \`slug\`, or PATCH /api/v1/blogs/${slug}.`, 409);
  }
  try {
    const doc = await Blog.create({ ...fields, slug });
    revalidateBlogs(slug);
    return apiBlog(doc.toObject());
  } catch (err) {
    if (err?.code === 11000) throw fail(`An article with the slug "${slug}" already exists.`, 409);
    throw err;
  }
}

/** Edit an article; only the fields sent change. The slug never does. */
export async function apiUpdateBlog(slug, body) {
  const fields = readFields(body, { partial: true });
  if (!Object.keys(fields).length) throw fail('Nothing to update — send at least one field.');
  await connectDB();
  const doc = await Blog.findOneAndUpdate(
    { slug: String(slug || '').toLowerCase() },
    { $set: fields },
    { new: true }
  ).lean();
  if (!doc) throw fail('Article not found. Only articles written in the admin panel or via the API can be edited here.', 404);
  revalidateBlogs(doc.slug);
  return apiBlog(doc);
}

export async function apiDeleteBlog(slug) {
  await connectDB();
  const doc = await Blog.findOneAndDelete({ slug: String(slug || '').toLowerCase() }).lean();
  if (!doc) throw fail('Article not found.', 404);
  revalidateBlogs(doc.slug);
  return { slug: doc.slug };
}
