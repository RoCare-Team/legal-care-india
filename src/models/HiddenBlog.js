import mongoose from 'mongoose';

/**
 * HiddenBlog — a built-in article the admin has removed from the site.
 *
 * The posts in src/data/blogs.js ship with the code and have no database row,
 * so there is nothing for a delete to remove. In production the source file is
 * read-only as well, so "delete" cannot mean editing it. What it means instead
 * is this: a row here names a built-in slug, and lib/blogs.js filters any
 * matching post out of every list — the public /blogs index, the article page,
 * the sitemap and the admin panel alike.
 *
 * Recording the removal rather than performing it is also what makes it
 * reversible. Dropping the row puts the article back exactly as it was, which
 * matters because nobody could restore a built-in post by hand — its text lives
 * in code, not in a form.
 */
const HiddenBlogSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.HiddenBlog || mongoose.model('HiddenBlog', HiddenBlogSchema);
