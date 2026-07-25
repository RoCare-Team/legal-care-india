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
      <Heading eyebrow="Areas of Practice" centered>
        Find a Lawyer by Practice Area
      </Heading>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATEGORIES.slice(0, 8).map((category, i) => (
          <SectionReveal key={category.slug} delay={i * 0.05}>
            <CategoryCard category={category} />
          </SectionReveal>
        ))}
      </div>

      {/* Below the grid, like the cities section — a right-aligned button beside
          a centred title reads as a mistake. */}
      <div className="mt-8 flex justify-center">
        <Button href="/legal-services" variant="outline" size="sm">
          View all services
        </Button>
      </div>
    </Section>
  );
}
