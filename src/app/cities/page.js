import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import CityCard from '@/components/cards/CityCard';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import { breadcrumbSchema } from '@/lib/schema';
import { getAllCities } from '@/lib/cities';

export const metadata = createMetadata({
  title: 'Find Lawyers by City',
  description:
    'Browse verified lawyers across every major city in India — Delhi, Mumbai, Bengaluru, Hyderabad and more.',
  path: '/cities',
});

export default async function CitiesPage() {
  const CITIES = await getAllCities();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Cities', path: '/cities' },
        ])}
      />
      <PageHeader
        eyebrow="Browse by City"
        title="Find Lawyers in Your City"
        subtitle="Select a city to discover verified lawyers near you and connect with them directly."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Cities' }]}
      />
      <Container className="py-10 sm:py-12">
        {/* Compact city tiles — six across on a wide screen, matching the
            homepage slider rather than the old four large photo panels. */}
        {/* This page shows every city, so it wraps rather than scrolling. */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
          {CITIES.map((city, i) => (
            <SectionReveal key={city.slug} delay={i * 0.04}>
              <CityCard city={city} />
            </SectionReveal>
          ))}
        </div>
      </Container>
    </>
  );
}
