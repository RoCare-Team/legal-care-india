import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import CategoryCard from '@/components/cards/CategoryCard';
import SectionReveal from '@/components/shared/SectionReveal';
import { CATEGORIES } from '@/data/categories';

export const metadata = createMetadata({
  title: 'Legal Services',
  description:
    'Explore every legal service on Legal Care India — from Civil and Criminal to Family, Property, Corporate and Tax law — and find the right advocate.',
  path: '/legal-services',
});

export default function LegalServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Browse by Legal Service"
        title="Explore Legal Services"
        subtitle="Pick a legal service to find advocates who specialise in exactly what your matter needs."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Legal Services' }]}
      />
      <Container className="py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((category, i) => (
            <SectionReveal key={category.slug} delay={i * 0.04}>
              <CategoryCard category={category} />
            </SectionReveal>
          ))}
        </div>
      </Container>
    </>
  );
}
