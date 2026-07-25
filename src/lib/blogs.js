import { unstable_cache } from 'next/cache';
import { BLOGS as STATIC_BLOGS } from '@/data/blogs';
import { connectDB } from '@/lib/db';
import Blog from '@/models/Blog';

/**
 * Blog data-access. Articles come from two places, merged into one list:
 *   1. The built-in posts in src/data/blogs.js (shipped with the site).
 *   2. Posts written by an admin, stored in MongoDB.
 *
 * Admin posts come first — they are the current ones — and the merged list is
 * cached under a tag, so publishing an article shows it on the public site
 * immediately (the admin API calls revalidateTag).
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

/**
 * Every article the public site should show — admin posts newest-first, then
 * the built-in ones. Used by /blogs, /blogs/[slug] and the sitemap.
 */
export async function getAllBlogs() {
  const dbBlogs = await getDbBlogs();
  const dbSlugs = new Set(dbBlogs.map((b) => b.slug));
  const builtIn = STATIC_BLOGS.filter((b) => !dbSlugs.has(b.slug));
  return [...dbBlogs, ...builtIn];
}

/** A single article by slug, or null. */
export async function getBlogBySlug(slug) {
  const all = await getAllBlogs();
  return all.find((b) => b.slug === slug) || null;
}

/**
 * Everything the admin panel lists: drafts included, and the built-in posts
 * flagged so the UI can show them as read-only rather than offering a delete
 * that could never work.
 */
export async function getAdminBlogs() {
  try {
    await connectDB();
    const rows = await Blog.find({}).sort({ createdAt: -1 }).lean();
    const posts = rows.map((r) => ({ ...toPost(r), id: String(r._id) }));
    const dbSlugs = new Set(posts.map((b) => b.slug));
    const builtIn = STATIC_BLOGS.filter((b) => !dbSlugs.has(b.slug)).map((b) => ({
      ...b,
      content: '',
      coverImage: '',
      published: true,
      custom: false,
    }));
    return [...posts, ...builtIn];
  } catch (err) {
    console.warn('getAdminBlogs: MongoDB unavailable', err);
    return STATIC_BLOGS.map((b) => ({ ...b, published: true, custom: false }));
  }
}
