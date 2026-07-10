import { notFound } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import AdvocateListing from '@/components/listing/AdvocateListing';
import JsonLd from '@/components/shared/JsonLd';
import { serviceSchema, breadcrumbSchema } from '@/lib/schema';
import { getAllAdvocates } from '@/lib/advocates';
import { getServiceBySlug, CATEGORIES } from '@/data/categories';
import { formatCompactNumber } from '@/utils/formatters';

// Prerender one page per legal service; advocate data is tag-cached so new
// registrations appear immediately (see lib/advocates).
export const revalidate = 3600;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return createMetadata({ title: 'Service Not Found', path: '/legal-services' });

  return createMetadata({
    title: `${service.name} Advocates`,
    description: `Find verified ${service.name} advocates in India. ${service.description} Compare experience and contact them directly.`,
    path: `/legal-services/${service.slug}`,
    keywords: [`${service.name} advocate`, `${service.name} lawyer`],
  });
}

export default async function LegalServicePage({ params }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const advocates = await getAllAdvocates();

  return (
    <>
      <JsonLd
        data={[
          serviceSchema(service),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Legal Services', path: '/legal-services' },
            { name: service.name, path: `/legal-services/${service.slug}` },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={`${formatCompactNumber(service.advocates)}+ advocates`}
        title={`${service.name} Advocates`}
        subtitle={service.description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services', href: '/legal-services' },
          { label: service.name },
        ]}
      />
      <Container className="py-10 sm:py-12">
        <AdvocateListing advocates={advocates} initial={{ service: service.name }} />
      </Container>
    </>
  );
}
