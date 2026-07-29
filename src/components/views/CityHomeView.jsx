import JsonLd from '@/components/shared/JsonLd';
import { breadcrumbSchema, webPageSchema } from '@/lib/schema';
import { cityPath } from '@/lib/serviceRoutes';

import Hero from '@/components/home/Hero';
import PopularCities from '@/components/home/PopularCities';
import FeaturedAdvocates from '@/components/home/FeaturedAdvocates';
import LawyerBanner from '@/components/home/LawyerBanner';
import Categories from '@/components/home/Categories';
import Stats from '@/components/home/Stats';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import CTA from '@/components/home/CTA';

/**
 * `/[city]` — the homepage, showing one city's data.
 *
 * It is deliberately the same page rather than a separate layout: a visitor who
 * taps a city tile should land somewhere familiar, with the city filled in, not
 * on a different-looking directory listing. The URL stays at /karaikal so the
 * page remains its own indexable address.
 *
 * Every section here is the homepage's own component taking an optional `city`.
 * What that changes is the *data*, not the design:
 *
 *   Hero        heading and lead name the city; practice chips stay inside it
 *   Advocates   lists lawyers registered in this city
 *   Categories  each card leads to that practice area within the city
 *   Stats       the lawyer count is the city's own, not the national total
 *
 * Passing no city to any of them gives the homepage exactly as it was.
 */
export function cityMeta(city) {
  return {
    title: `Lawyers in ${city.name}`,
    description: `Find and consult verified lawyers in ${city.name}, ${city.state}. Compare experience, ratings and fees, then speak to the one you choose by chat, call or video.`,
    path: cityPath(city),
    keywords: [
      `lawyers in ${city.name}`,
      `${city.name} lawyer`,
      `advocate in ${city.name}`,
      `best lawyer in ${city.name}`,
    ],
  };
}

export default function CityHomeView({ city }) {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            name: `Lawyers in ${city.name}`,
            description: `Verified lawyers in ${city.name}, ${city.state}.`,
            path: cityPath(city),
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Cities', path: '/cities' },
            { name: city.name, path: cityPath(city) },
          ]),
        ]}
      />

      <Hero city={city} />
      <PopularCities />
      <FeaturedAdvocates city={city} />
      <LawyerBanner />
      <Categories city={city} />
      <Stats city={city} />
      <HowItWorks />
      <Testimonials />
      <CTA />
    </>
  );
}
