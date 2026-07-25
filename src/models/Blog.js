import mongoose from 'mongoose';

/**
 * Blog — an article written in the admin panel, shown at /blogs/[slug]
 * alongside the built-in posts in src/data/blogs.js.
 *
 * `published` is what decides public visibility: a draft is only ever visible
 * inside the admin panel, so a half-written article can be saved without it
 * appearing on the site or in the sitemap.
 */
const BlogSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    // One-line summary: the card, the meta description and the article intro.
    excerpt: { type: String, default: '', trim: true },
    category: { type: String, default: 'Legal Guide', trim: true },
    // The article itself. Plain text: blank lines separate paragraphs and a
    // leading "## " marks a heading — no HTML is stored, so nothing a writer
    // pastes in can inject markup into the page.
    content: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    // Derived from the word count when saved, so nobody has to guess it.
    readMinutes: { type: Number, default: 1, min: 1 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
