import { Section } from '@/components/ui';
import CityTileRail from './CityTileRail';
import { getAllCities } from '@/lib/cities';
import { getLawyerCountsByCity } from '@/lib/stats';

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
  const [cities, counts] = await Promise.all([getAllCities(), getLawyerCountsByCity()]);

  return (
    <Section spacing="sm" className="pb-6 sm:pb-8">
      {/* The rail carries its own heading, its way out and its arrows, all on
          one row — see CityTileRail. */}
      <CityTileRail cities={cities.slice(0, RAIL_LIMIT)} counts={counts} />
    </Section>
  );
}
