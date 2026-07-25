import { Section, Heading, Button } from '@/components/ui';
import CitiesCarousel from './CitiesCarousel';
import { getAllCities } from '@/lib/cities';

/**
 * PopularCities — quick access to lawyer listings by major city.
 */
export default async function PopularCities() {
  // Homepage shows only the first 12 cities; the rest live on the /cities page
  // ("View all cities").
  const CITIES = (await getAllCities()).slice(0, 12);

  return (
    <Section>
      <Heading eyebrow="Courts Across India" centered>
        Lawyers in Your City
      </Heading>

      <CitiesCarousel cities={CITIES} />

      {/* Below the slider once the heading is centred — a right-aligned button
          beside a centred title reads as a mistake. */}
      <div className="mt-8 flex justify-center">
        <Button href="/cities" variant="outline" size="sm">
          View all cities
        </Button>
      </div>
    </Section>
  );
}
