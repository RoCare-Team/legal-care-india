import { notFound } from 'next/navigation';
import { Clock } from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container, Button } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import BlogCard from '@/components/cards/BlogCard';
import JsonLd from '@/components/shared/JsonLd';
import { articleSchema, breadcrumbSchema } from '@/lib/schema';
import { BLOGS } from '@/data/blogs';

export function generateStaticParams() {
  return BLOGS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = BLOGS.find((p) => p.slug === slug);
  if (!post) return createMetadata({ title: 'Article Not Found', path: '/blogs' });

  const meta = createMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blogs/${post.slug}`,
    keywords: [post.category, `${post.category} india`],
  });
  let publishedTime;
  try {
    publishedTime = post.date ? new Date(post.date).toISOString() : undefined;
  } catch {
    publishedTime = undefined;
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

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = BLOGS.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = BLOGS.filter((p) => p.slug !== post.slug).slice(0, 3);

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
        <div className="mb-6 flex items-center gap-2 text-sm text-ink/45">
          <span>{post.date}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {post.readMinutes} min read
          </span>
        </div>

        <article className="space-y-4 text-[15px] leading-relaxed text-ink/75">
          <p>{post.excerpt}</p>
          <p>
            This is a sample article body for <strong>{post.title}</strong>. In production this
            content would come from your CMS. It walks readers through the topic in clear,
            practical steps so they know what to expect and how a lawyer can help.
          </p>
          <p>
            When you&apos;re ready, browse verified lawyers who specialise in{' '}
            {post.category.toLowerCase()} and reach out directly by call, WhatsApp or email.
          </p>
        </article>

        <div className="mt-8 rounded-2xl bg-muted/50 p-6 text-center">
          <p className="font-medium text-ink">Need help with a {post.category.toLowerCase()} matter?</p>
          <Button href="/lawyers" className="mt-3">Find a Lawyer</Button>
        </div>
      </Container>

      <Container className="pb-16">
        <h2 className="mb-6 font-display text-xl font-semibold text-ink">Related Articles</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p) => (
            <BlogCard key={p.slug} post={p} />
          ))}
        </div>
      </Container>
    </>
  );
}
