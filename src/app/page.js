import { createMetadata } from '@/lib/metadata';
import Hero from '@/components/home/Hero';
import Categories from '@/components/home/Categories';
import Stats from '@/components/home/Stats';
import FeaturedAdvocates from '@/components/home/FeaturedAdvocates';
import HowItWorks from '@/components/home/HowItWorks';
import PopularCities from '@/components/home/PopularCities';
import Testimonials from '@/components/home/Testimonials';
import CTA from '@/components/home/CTA';

export const metadata = createMetadata({ path: '/' });
export const dynamic = 'force-dynamic';

/**
 * Home — composes the homepage from independent, reusable sections.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedAdvocates />
      <Categories />
      <Stats />
      
      <HowItWorks />
      <PopularCities />
      <Testimonials />
      <CTA />
    </>
  );
}
