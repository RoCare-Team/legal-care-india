import { createMetadata } from '@/lib/metadata';
import PageHeader from '@/components/shared/PageHeader';
import { Container } from '@/components/ui';
import AdvocateListing from '@/components/listing/AdvocateListing';
import { getAllAdvocates } from '@/lib/advocates';
import { getServiceBySlug } from '@/data/categories';
import { CITIES } from '@/data/cities';

export const metadata = createMetadata({
  title: 'Find Verified Advocates',
  description:
    'Search and compare verified advocates across India by legal service, city, language, experience and consultation fee.',
  path: '/advocates',
});

// Directory content depends on live registrations — render on each request.
export const dynamic = 'force-dynamic';

/** Resolve the query-string slugs coming from search into filter labels. */
function resolveInitial(params = {}) {
  const initial = {};
  if (params.q) initial.query = String(params.q);
  if (params.service) {
    const svc = getServiceBySlug(String(params.service));
    if (svc) initial.service = svc.name;
  }
  if (params.city) {
    const city = CITIES.find((c) => c.slug === String(params.city));
    if (city) initial.city = city.name;
  }
  return initial;
}

export default async function AdvocatesPage({ searchParams }) {
  const params = await searchParams;
  const advocates = await getAllAdvocates();
  const initial = resolveInitial(params);

  return (
    <>
      <PageHeader
        eyebrow="Advocate Directory"
        title="Find Verified Advocates Across India"
        subtitle="Browse trusted advocates by legal service, city and experience — then call, WhatsApp or email them directly."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Find Advocates' }]}
      />
      <Container className="py-10 sm:py-12">
        <AdvocateListing advocates={advocates} initial={initial} />
      </Container>
    </>
  );
}
