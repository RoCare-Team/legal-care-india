import { Section, Heading, Button } from '@/components/ui';
import CategoryCard from '@/components/cards/CategoryCard';
import SectionReveal from '@/components/shared/SectionReveal';
import { CATEGORIES } from '@/data/categories';

/**
 * Categories — grid of popular legal services users can browse.
 */
export default function Categories() {
  return (
    <Section id="legal-services">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <Heading
          eyebrow="Browse by Legal Service"
          subtitle="Find the right lawyer for your specific legal need."
        >
          Popular Legal Services
        </Heading>
        <Button href="/legal-services" variant="outline" size="sm" className="shrink-0">
          View all services
        </Button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATEGORIES.slice(0, 8).map((category, i) => (
          <SectionReveal key={category.slug} delay={i * 0.05}>
            <CategoryCard category={category} />
          </SectionReveal>
        ))}
      </div>
    </Section>
  );
}
