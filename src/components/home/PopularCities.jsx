import { Section, Heading, Button } from '@/components/ui';
import CityTileRail from './CityTileRail';
import { getAllCities } from '@/lib/cities';

/**
 * How many city tiles the homepage rail carries. `getAllCities` returns the
 * curated popular cities first, so this takes the ones worth leading with and
 * leaves the rest to /cities.
 *
 * The rail used to render every city there was. At ~100 cities that alone made
 * the homepage a 1 MB document: each tile ships a next/image `srcSet` of eight
 * fully-encoded remote URLs, and React's hydration payload then repeats the
 * whole list a second time — over 700 KB of markup, plus ~100 separate image
 * requests, for a band the visitor scrolls past. Twenty is a full rail on any
 * screen; "View all cities" covers the rest.
 */
const RAIL_LIMIT = 20;

/**
 * PopularCities — quick access to lawyer listings by major city.
 */
export default async function PopularCities() {
  const CITIES = (await getAllCities()).slice(0, RAIL_LIMIT);

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
