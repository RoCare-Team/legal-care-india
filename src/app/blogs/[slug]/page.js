import { notFound } from 'next/navigation';
import { Clock } from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container, Button } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import BlogCard from '@/components/cards/BlogCard';
import JsonLd from '@/components/shared/JsonLd';
import { SeoSection, LinkCardGrid } from '@/components/shared/SeoSection';
import { articleSchema, breadcrumbSchema } from '@/lib/schema';
import { getAllBlogs, getBlogBySlug } from '@/lib/blogs';

export async function generateStaticParams() {
  const posts = await getAllBlogs();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return createMetadata({ title: 'Article Not Found', path: '/blogs' });

  const meta = createMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blogs/${post.slug}`,
    keywords: [post.category, `${post.category} india`],
  });
  let publishedTime = post.publishedAt || undefined;
  if (!publishedTime) {
    try {
      publishedTime = post.date ? new Date(post.date).toISOString() : undefined;
    } catch {
      publishedTime = undefined;
    }
  }
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: 'article',
      ...(publishedTime ? { publishedTime } : {}),
    },
  };
}

/**
 * Turn the plain text an admin wrote into blocks. A blank line starts a new
 * paragraph and a leading "## " marks a heading — deliberately the whole
 * syntax, since the text is rendered as text and never as HTML.
 */
function toBlocks(content = '') {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      block.startsWith('## ')
        ? { type: 'heading', text: block.slice(3).trim() }
        : { type: 'paragraph', text: block }
    );
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const posts = await getAllBlogs();
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  // Same-category posts first — a reader on a property piece is far likelier
  // to want another property piece than whatever happens to be newest. The
  // rest of the list backfills so the row is never half-empty.
  const others = posts.filter((p) => p.slug !== post.slug);
  const related = [
    ...others.filter((p) => p.category === post.category),
    ...others.filter((p) => p.category !== post.category),
  ].slice(0, 3);
  const blocks = toBlocks(post.content);

  return (
    <>
      <JsonLd
        data={[
          articleSchema(post),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blogs', path: '/blogs' },
            { name: post.title, path: `/blogs/${post.slug}` },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={post.category}
        title={post.title}
        subtitle={post.excerpt}
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Blogs', href: '/blogs' }, { label: post.category }]}
      />

      <Container size="narrow" className="py-10 sm:py-12">
        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.title}
            className="mb-6 h-56 w-full rounded-2xl object-cover sm:h-72"
          />
        )}

        <div className="mb-6 flex items-center gap-2 text-sm text-ink/45">
          <span>{post.date}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {post.readMinutes} min read
          </span>
        </div>

        <article className="space-y-4 text-[15px] leading-relaxed text-ink/75">
          {blocks.length > 0 ? (
            blocks.map((b, i) =>
              b.type === 'heading' ? (
                <h2 key={i} className="pt-2 font-display text-lg font-semibold text-ink">
                  {b.text}
                </h2>
              ) : (
                <p key={i} className="whitespace-pre-line">
                  {b.text}
                </p>
              )
            )
          ) : (
            // The built-in posts ship with a summary only.
            <p>{post.excerpt}</p>
          )}
        </article>

        <div className="mt-8 rounded-2xl bg-muted/50 p-6 text-center">
          <p className="font-medium text-ink">Need help with a {post.category.toLowerCase()} matter?</p>
          <Button href="/lawyers" className="mt-3">Find a Lawyer</Button>
        </div>
      </Container>

      <Container className="pb-16">
        {related.length > 0 && (
          <>
            <h2 className="mb-6 font-display text-xl font-semibold text-ink">Related Articles</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </>
        )}

        {/* Every article is a dead end without this: the reader finishes,
            agrees they need a lawyer, and has nowhere to go. These are real
            routes on the site — no claims are made about the article itself. */}
        <SeoSection
          title="Take the Next Step"
          lead={`Reading up is the right first move. When the question becomes what to do about your own ${post.category.toLowerCase()} matter, that needs a lawyer looking at your facts.`}
          className={related.length > 0 ? 'mt-16' : 'mt-0'}
        >
          <LinkCardGrid
            items={[
              {
                href: '/lawyers',
                title: 'Find a verified lawyer',
                text: 'Filter by practice area, city, court and language. Compare per-minute rates before you start.',
              },
              {
                href: '/legal-services',
                title: 'Browse practice areas',
                text: 'See what a matter in each area of law usually involves and which lawyers handle it.',
              },
              {
                href: '/blogs',
                title: 'More legal guides',
                text: 'Plain-English explanations of process, paperwork and cost across Indian law.',
              },
            ]}
            columns={3}
          />
        </SeoSection>
      </Container>
    </>
  );
}
