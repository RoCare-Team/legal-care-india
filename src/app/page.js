import { createMetadata } from '@/lib/metadata';
import Hero from '@/components/home/Hero';
import QuickActions from '@/components/home/QuickActions';
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
    <>
      <Hero />
      <QuickActions />
      <FeaturedAdvocates />
      <Categories />
      <Stats />
      <PopularCities />
      <HowItWorks />
      <Testimonials />
      <CTA />
    </>
  );
}
