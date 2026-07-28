import { Section, Heading, Button } from '@/components/ui';
import CityTileRail from './CityTileRail';
import { getAllCities } from '@/lib/cities';

/**
 * PopularCities — quick access to lawyer listings by major city.
 */
export default async function PopularCities() {
  // Everything goes into the rail; it scrolls, so there is no reason to hide
  // cities here the way the old fixed grid had to.
  const CITIES = await getAllCities();

  return (
    <Section spacing="sm">
      {/* <Heading eyebrow="Courts Across India" centered>/  */}
        {/* Lawyers in Your City */}
      {/* </Heading> */}

      <div className="flex justify-end">
        <Button href="/cities" variant="outline" size="sm">
          View all cities
        </Button>
      </div>

      <CityTileRail cities={CITIES} />
    </Section>
  );
}
