import { unstable_cache } from 'next/cache';
import { BLOGS as STATIC_BLOGS } from '@/data/blogs';
import { connectDB } from '@/lib/db';
import Blog from '@/models/Blog';
import HiddenBlog from '@/models/HiddenBlog';

/**
 * Blog data-access. Articles come from two places, merged into one list:
 *   1. The built-in posts in src/data/blogs.js (shipped with the site).
 *   2. Posts written by an admin, stored in MongoDB.
 *
 * Admin posts come first — they are the current ones — and the merged list is
 * cached under a tag, so publishing an article shows it on the public site
 * immediately (the admin API calls revalidateTag).
 *
 * A built-in post has no row to delete, so removing one is recorded in the
 * HiddenBlog collection instead and applied here — which is why every list in
 * this file drops hidden slugs rather than each caller remembering to.
 */
export const BLOGS_TAG = 'blogs';

/** How many words a minute we assume when estimating read time. */
const WORDS_PER_MINUTE = 200;

/** Estimated minutes to read a piece of text (never less than 1). */
export function readingMinutes(text = '') {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** "12 June 2026" — how a post's date reads on the card and the article. */
export function formatBlogDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** One DB row in the same shape the pages already expect from a post. */
function toPost(r) {
  return {
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt || '',
    category: r.category || 'Legal Guide',
    content: r.content || '',
    coverImage: r.coverImage || '',
    readMinutes: r.readMinutes || 1,
    date: formatBlogDate(r.createdAt),
    // ISO form for <meta> and JSON-LD, where a display date won't do.
    publishedAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    published: r.published !== false,
    custom: true, // admin-written (so the panel can offer edit/delete)
  };
}

const _getDbBlogs = unstable_cache(
  async () => {
    await connectDB();
    const rows = await Blog.find({ published: true }).sort({ createdAt: -1 }).lean();
    return rows.map(toPost);
  },
  ['db-blogs'],
  { revalidate: 3600, tags: [BLOGS_TAG] }
);

/** Published DB posts only (empty if the DB is unreachable). */
async function getDbBlogs() {
  try {
    return await _getDbBlogs();
  } catch (err) {
    console.warn('getDbBlogs: MongoDB unavailable', err);
    return [];
  }
}

const _getHiddenSlugs = unstable_cache(
  async () => {
    await connectDB();
    const rows = await HiddenBlog.find({}).select('slug').lean();
    return rows.map((r) => r.slug);
  },
  ['hidden-blogs'],
  { revalidate: 3600, tags: [BLOGS_TAG] }
);

/**
 * Built-in slugs the admin has removed.
 *
 * An unreachable database returns nothing, which shows every built-in post.
 * That is the safe way round: a hidden article briefly reappearing is a smaller
 * failure than the whole Blogs section emptying because Mongo blinked.
 */
export async function getHiddenSlugs() {
  try {
    return new Set(await _getHiddenSlugs());
  } catch (err) {
    console.warn('getHiddenSlugs: MongoDB unavailable', err);
    return new Set();
  }
}

/**
 * Every article the public site should show — admin posts newest-first, then
 * the built-in ones that have not been removed. Used by /blogs, /blogs/[slug]
 * and the sitemap.
 */
export async function getAllBlogs() {
  const [dbBlogs, hidden] = await Promise.all([getDbBlogs(), getHiddenSlugs()]);
  const dbSlugs = new Set(dbBlogs.map((b) => b.slug));
  const builtIn = STATIC_BLOGS.filter((b) => !dbSlugs.has(b.slug) && !hidden.has(b.slug));
  return [...dbBlogs, ...builtIn];
}

/** A single article by slug, or null. */
export async function getBlogBySlug(slug) {
  const all = await getAllBlogs();
  return all.find((b) => b.slug === slug) || null;
}

/**
 * Everything the admin panel lists: drafts included, and the built-in posts
 * flagged so the UI can tell them apart — they have no row to edit, only to
 * hide. Removed built-ins are returned too, marked `hidden`, because the panel
 * is the only place they can be put back from.
 */
export async function getAdminBlogs() {
  try {
    await connectDB();
    const [rows, hiddenRows] = await Promise.all([
      Blog.find({}).sort({ createdAt: -1 }).lean(),
      HiddenBlog.find({}).select('slug').lean(),
    ]);
    const posts = rows.map((r) => ({ ...toPost(r), id: String(r._id) }));
    const dbSlugs = new Set(posts.map((b) => b.slug));
    const hidden = new Set(hiddenRows.map((r) => r.slug));
    const builtIn = STATIC_BLOGS.filter((b) => !dbSlugs.has(b.slug)).map((b) => ({
      ...b,
      content: '',
      coverImage: '',
      published: true,
      custom: false,
      hidden: hidden.has(b.slug),
    }));
    return [...posts, ...builtIn];
  } catch (err) {
    console.warn('getAdminBlogs: MongoDB unavailable', err);
    return STATIC_BLOGS.map((b) => ({ ...b, published: true, custom: false, hidden: false }));
  }
}
