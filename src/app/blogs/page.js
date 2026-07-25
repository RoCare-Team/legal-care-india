import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import BlogCard from '@/components/cards/BlogCard';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import { breadcrumbSchema } from '@/lib/schema';
import { getAllBlogs } from '@/lib/blogs';

export const metadata = createMetadata({
  title: 'Legal Blogs & Guides',
  description:
    'Practical legal guides and articles from Legal Care India — understand your rights, processes and how to work with a lawyer.',
  path: '/blogs',
});

export default async function BlogsPage() {
  const posts = await getAllBlogs();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Blogs', path: '/blogs' },
        ])}
      />
      <PageHeader
        eyebrow="Legal Blogs & Guides"
        title="Understand your legal matters"
        subtitle="Plain-language guides to help you make informed decisions and work effectively with a lawyer."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Blogs' }]}
      />
      <Container className="py-10 sm:py-12">
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/15 py-16 text-center text-sm text-ink/50">
            No articles yet — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <SectionReveal key={post.slug} delay={i * 0.05}>
                <BlogCard post={post} />
              </SectionReveal>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
