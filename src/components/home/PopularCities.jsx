import { Section, Heading, Button } from '@/components/ui';
import CityCard from '@/components/cards/CityCard';
import SectionReveal from '@/components/shared/SectionReveal';
import { CITIES } from '@/data/cities';

/**
 * PopularCities — quick access to advocate listings by major city.
 */
export default function PopularCities() {
  return (
    <Section>
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <Heading
          eyebrow="Browse by City"
          subtitle="Discover verified advocates in your city across India."
        >
          Popular Cities
        </Heading>
        <Button href="/cities" variant="outline" size="sm" className="shrink-0">
          View all cities
        </Button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CITIES.map((city, i) => (
          <SectionReveal key={city.slug} delay={i * 0.03}>
            <CityCard city={city} />
          </SectionReveal>
        ))}
      </div>
    </Section>
  );
}
