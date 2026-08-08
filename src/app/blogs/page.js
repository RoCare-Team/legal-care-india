import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import BlogCard from '@/components/cards/BlogCard';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import { SeoSection, LinkCardGrid } from '@/components/shared/SeoSection';
import { breadcrumbSchema } from '@/lib/schema';
import { getAllBlogs } from '@/lib/blogs';

export const metadata = createMetadata({
  title: 'Legal Guides & Articles for India',
  description:
    'Plain-English guides to Indian law — property, family, criminal, consumer and more. Understand the process before you speak to a lawyer.',
  path: '/blogs',
  keywords: [
    'legal guides india',
    'indian law explained',
    'legal advice articles',
    'know your rights india',
  ],
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
        <SectionReveal>
          <section>
            <h2 className="font-display text-2xl font-bold text-ink">Latest Legal Guides</h2>
            <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink/60">
              Written for people dealing with something for the first time — what the
              process actually looks like, what it tends to cost, what to keep ready, and
              where a lawyer is genuinely needed rather than optional.
            </p>

            {posts.length === 0 ? (
              <p className="mt-7 rounded-2xl border border-dashed border-ink/15 py-16 text-center text-sm text-ink/50">
                No articles yet — check back soon.
              </p>
            ) : (
              <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post, i) => (
                  <SectionReveal key={post.slug} delay={i * 0.05}>
                    <BlogCard post={post} />
                  </SectionReveal>
                ))}
              </div>
            )}
          </section>
        </SectionReveal>

        <SeoSection
          title="Where to Go From Here"
          lead="A guide explains the ground. When you need it applied to your own facts, that is what a consultation is for."
        >
          <LinkCardGrid
            items={[
              {
                href: '/legal-services',
                title: 'Browse by practice area',
                text: 'Property, family, criminal, civil, corporate, tax and more — each with what a matter in that area usually involves.',
              },
              {
                href: '/lawyers',
                title: 'Find a lawyer',
                text: 'Filter by area, city, court and language, compare per-minute rates, and consult by chat, call or video.',
              },
              {
                href: '/cities',
                title: 'Browse by city',
                text: 'Lawyers city by city, which matters when a case has to be filed and argued in a particular court.',
              },
            ]}
            columns={3}
          />
        </SeoSection>
      </Container>
    </>
  );
}
