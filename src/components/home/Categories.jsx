import { Section, Heading } from '@/components/ui';
import CategoryCard from '@/components/cards/CategoryCard';
import SectionReveal from '@/components/shared/SectionReveal';
import { CATEGORIES } from '@/data/categories';
import { cityServicePath } from '@/lib/serviceRoutes';
import { getLawyerCountsBySpecialization } from '@/lib/stats';

/**
 * Categories — grid of popular legal services users can browse.
 *
 * The lawyer count on each card is counted from the database, not the figure
 * carried on the category in `data/categories.js` — those were placeholders
 * from before there was a database, and "4.2K+ lawyers" on a directory holding
 * three of them is the one number a visitor can check for themselves.
 *
 * On a city page the same grid is shown, scoped to that city: the heading names
 * it, every card leads to that practice area *within* the city, and the counts
 * narrow to lawyers registered there.
 *
 * @param {object} props
 * @param {object} [props.city]  the city this page is scoped to, if any
 */
export default async function Categories({ city }) {
  const counts = await getLawyerCountsBySpecialization(city?.name);

  return (
    <Section id="legal-services" spacing="sm">
      <Heading centered>
        {city ? `Find a Lawyer in ${city.name} by Practice Area` : 'Find a Lawyer by Practice Area'}
      </Heading>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATEGORIES.slice(0, 8).map((category, i) => (
          <SectionReveal key={category.slug} delay={i * 0.05}>
            <CategoryCard
              category={category}
              href={city ? cityServicePath(category, city) : undefined}
              count={counts[category.name] || 0}
            />
          </SectionReveal>
        ))}
      </div>
    </Section>
  );
}
