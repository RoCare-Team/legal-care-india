import { Section, Heading } from '@/components/ui';
import CategoryCard from '@/components/cards/CategoryCard';
import SectionReveal from '@/components/shared/SectionReveal';
import { CATEGORIES } from '@/data/categories';

/**
 * Categories — grid of popular legal services users can browse.
 */
export default function Categories() {
  return (
    <Section id="legal-services">
      <Heading centered>Find a Lawyer by Practice Area</Heading>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATEGORIES.slice(0, 8).map((category, i) => (
          <SectionReveal key={category.slug} delay={i * 0.05}>
            <CategoryCard category={category} />
          </SectionReveal>
        ))}
      </div>
    </Section>
  );
}
