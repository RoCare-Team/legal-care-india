import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import BlogCard from '@/components/cards/BlogCard';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import { breadcrumbSchema } from '@/lib/schema';
import { BLOGS } from '@/data/blogs';

export const metadata = createMetadata({
  title: 'Legal Blogs & Guides',
  description:
    'Practical legal guides and articles from Legal Care India — understand your rights, processes and how to work with a lawyer.',
  path: '/blogs',
});

export default function BlogsPage() {
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BLOGS.map((post, i) => (
            <SectionReveal key={post.slug} delay={i * 0.05}>
              <BlogCard post={post} />
            </SectionReveal>
          ))}
        </div>
      </Container>
    </>
  );
}
