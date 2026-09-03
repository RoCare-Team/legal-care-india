import { createMetadata } from '@/lib/metadata';
import Hero from '@/components/home/Hero';
import PopularLegalAreas from '@/components/home/PopularLegalAreas';
import AnonymousBand from '@/components/home/AnonymousBand';
import Categories from '@/components/home/Categories';
import Stats from '@/components/home/Stats';
import FeaturedAdvocates from '@/components/home/FeaturedAdvocates';
import HowItWorks from '@/components/home/HowItWorks';
import PopularCities from '@/components/home/PopularCities';
import Testimonials from '@/components/home/Testimonials';
import CTA from '@/components/home/CTA';

export const metadata = createMetadata({ path: '/' });
// Statically rendered and served from the CDN. The lawyer data it shows is
// tag-cached, so registrations/edits refresh it instantly (see lib/lawyers).
export const revalidate = 3600;

/**
 * Home — composes the homepage from independent, reusable sections.
 */
export default function HomePage() {
  return (
    // The order is the order a visitor's own questions arrive in: where and
    // what kind of lawyer (hero), the four areas most matters fall under, then
    // actual people they could call — before anything about the platform
    // itself. The anonymity promise comes after those lawyers rather than
    // before, because "can I do this without giving my name" is the question
    // that stops someone who has just found a lawyer they want to call.
    <>
      <Hero />
      <PopularLegalAreas />
      <FeaturedAdvocates />
      <AnonymousBand />
      <PopularCities />
      {/* No LawyerBanner here. It makes the anonymity pitch a second time —
          same promise, same two links — one screen below AnonymousBand, and
          two pitches in a row read as a page that does not know what it has
          already said. The city pages still use it; they have no such band. */}
      <Categories />
      <Stats />
      <HowItWorks />
      <Testimonials />
      <CTA />
    </>
  );
}
