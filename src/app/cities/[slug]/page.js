import { notFound } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import AdvocateListing from '@/components/listing/AdvocateListing';
import JsonLd from '@/components/shared/JsonLd';
import { breadcrumbSchema } from '@/lib/schema';
import { getAllAdvocates } from '@/lib/advocates';
import { getAllCities, getCityBySlug } from '@/lib/cities';
import { formatCompactNumber } from '@/utils/formatters';

// Prerender one page per city; advocate data is tag-cached so new
// registrations appear immediately (see lib/advocates).
export const revalidate = 3600;

export async function generateStaticParams() {
  const cities = await getAllCities();
  return cities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return createMetadata({ title: 'City Not Found', path: '/cities' });

  return createMetadata({
    title: `Advocates in ${city.name}`,
    description: `Find and connect with verified advocates in ${city.name}, ${city.state}. Search by legal service, compare experience and contact them directly.`,
    path: `/cities/${city.slug}`,
    keywords: [`advocates in ${city.name}`, `lawyers in ${city.name}`],
  });
}

export default async function CityPage({ params }) {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const advocates = await getAllAdvocates();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Cities', path: '/cities' },
          { name: city.name, path: `/cities/${city.slug}` },
        ])}
      />
      <PageHeader
        eyebrow={`${formatCompactNumber(city.advocates)}+ advocates`}
        title={`Advocates in ${city.name}`}
        subtitle={`Discover verified advocates across ${city.name}, ${city.state} and reach them directly by call, WhatsApp or email.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Cities', href: '/cities' },
          { label: city.name },
        ]}
      />
      <Container className="py-10 sm:py-12">
        <AdvocateListing advocates={advocates} initial={{ city: city.name }} />
      </Container>
    </>
  );
}
