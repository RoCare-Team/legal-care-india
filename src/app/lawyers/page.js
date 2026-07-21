import { createMetadata } from '@/lib/metadata';
import PageHeader from '@/components/shared/PageHeader';
import { Container } from '@/components/ui';
import AdvocateListing from '@/components/listing/AdvocateListing';
import JsonLd from '@/components/shared/JsonLd';
import { breadcrumbSchema, collectionSchema } from '@/lib/schema';
import { getAllAdvocates } from '@/lib/advocates';
import { getServiceBySlug, getSubServiceBySlug } from '@/data/categories';
import { getAllCities } from '@/lib/cities';

export const metadata = createMetadata({
  title: 'Find Verified Lawyers',
  description:
    'Search and compare verified lawyers across India by legal service, city, language, experience and consultation fee.',
  path: '/lawyers',
});

// The page reads search filters (searchParams) so it renders per request, but
// the lawyer data itself is tag-cached — no MongoDB round-trip each visit.
export const revalidate = 3600;

/** Turn a slug back into a display name, e.g. "new-delhi" → "New Delhi". */
function deslugify(slug) {
  return String(slug)
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Resolve the query-string slugs coming from search into filter labels. */
function resolveInitial(params = {}, cities = []) {
  const initial = {};
  if (params.q) initial.query = String(params.q);
  if (params.service) {
    const svc = getServiceBySlug(String(params.service));
    if (svc) {
      initial.service = svc.name;
      // A sub-category only means anything inside its parent service, so it is
      // resolved against the service we just matched.
      if (params.sub) {
        const sub = getSubServiceBySlug(svc.name, String(params.sub));
        if (sub) initial.subService = sub;
      }
    }
  }
  if (params.city) {
    // Known cities resolve to their canonical name; anything else (e.g. a city
    // typed by hand that isn't in our list) still filters by its de-slugged name
    // so it can match a lawyer's practice cities.
    const slug = String(params.city);
    const city = cities.find((c) => c.slug === slug);
    initial.city = city ? city.name : deslugify(slug);
  }
  return initial;
}

export default async function AdvocatesPage({ searchParams }) {
  const params = await searchParams;
  const [advocates, cities] = await Promise.all([getAllAdvocates(), getAllCities()]);
  const initial = resolveInitial(params, cities);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Find Lawyers', path: '/lawyers' },
          ]),
          collectionSchema({
            name: 'Find Verified Lawyers Across India',
            path: '/lawyers',
            description:
              'Search and compare verified lawyers across India by legal service, city and experience.',
            advocates,
          }),
        ]}
      />
      <PageHeader
        eyebrow="Lawyer Directory"
        title="Find Verified Lawyers Across India"
        subtitle="Browse trusted lawyers by legal service, city and experience — then call, WhatsApp or email them directly."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Find Lawyers' }]}
      />
      {/* Pull the filter/search bar up so it floats over the hero — the first
          thing a visitor reaches, clearly above the fold. */}
      <Container className="relative z-20 -mt-12 pb-10 sm:-mt-16 sm:pb-12">
        <AdvocateListing advocates={advocates} initial={initial} cities={cities} floatFilters />
      </Container>
    </>
  );
}
