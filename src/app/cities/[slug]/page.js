import { notFound } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import AdvocateListing from '@/components/listing/AdvocateListing';
import { getAllAdvocates } from '@/lib/advocates';
import { CITIES } from '@/data/cities';
import { formatCompactNumber } from '@/utils/formatters';

// Listing reflects live registrations — render on each request (no build-time
// prerender, so newly registered advocates appear immediately).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
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
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) notFound();

  const advocates = await getAllAdvocates();

  return (
    <>
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
