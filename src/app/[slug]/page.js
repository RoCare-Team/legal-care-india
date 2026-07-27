import { notFound, permanentRedirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { resolveSegment, legacySegmentPath } from '@/lib/serviceRoutes';
import { getAllCities } from '@/lib/cities';
import { CATEGORIES, getAllSubServiceParams } from '@/data/categories';
import CityView, { cityMeta } from '@/components/views/CityView';
import ServiceView, { serviceMeta } from '@/components/views/ServiceView';
import MatterView, { matterMeta } from '@/components/views/MatterView';
import CityServiceView, { cityServiceMeta } from '@/components/views/CityServiceView';
import CityMatterView, { cityMatterMeta } from '@/components/views/CityMatterView';

/**
 * The single root-level dynamic route. Next.js allows only one dynamic segment
 * per level, so cities, legal services and their city-scoped variants all land
 * here and `resolveSegment` decides which page to render:
 *
 *   /mumbai                        → CityView
 *   /criminal-lawyer               → ServiceView
 *   /bail-matters-lawyer           → MatterView
 *   /criminal-lawyer-in-mumbai     → CityServiceView
 *   /bail-matters-lawyer-in-mumbai → CityMatterView
 *
 * Combos render on demand (dynamicParams defaults to true) and are cached.
 * Lawyer data is tag-cached so new registrations appear immediately.
 */
export const revalidate = 3600;

/** Prerender the cities, services and matters; city combos render on demand. */
export async function generateStaticParams() {
  const cities = await getAllCities();
  return [
    ...cities.map((c) => ({ slug: c.slug })),
    ...CATEGORIES.map((c) => ({ slug: c.slug })),
    ...getAllSubServiceParams().map(({ sub }) => ({ slug: `${sub}-lawyer` })),
  ];
}

/** Turn a resolved segment into page metadata. */
function metaFor(resolved) {
  switch (resolved.kind) {
    case 'city':
      return cityMeta(resolved.city);
    case 'service':
      return serviceMeta(resolved.service);
    case 'matter':
      return matterMeta(resolved.service, resolved.subService, resolved.subSlug);
    case 'city-service':
      return cityServiceMeta(resolved.service, resolved.city);
    case 'city-matter':
      return cityMatterMeta(
        resolved.service,
        resolved.subService,
        resolved.subSlug,
        resolved.city
      );
    default:
      return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const resolved = await resolveSegment(slug);
  const meta = resolved && metaFor(resolved);
  return meta ? createMetadata(meta) : createMetadata({ title: 'Not Found', path: '/' });
}

export default async function RootSlugPage({ params }) {
  const { slug } = await params;
  const resolved = await resolveSegment(slug);

  if (!resolved) {
    // Might be one of the retired `-law` slugs — send it to its new home
    // rather than 404ing on a URL search engines already know about.
    const legacy = await legacySegmentPath(slug);
    if (legacy) permanentRedirect(legacy);
    notFound();
  }

  switch (resolved.kind) {
    case 'city':
      return <CityView city={resolved.city} />;
    case 'service':
      return <ServiceView service={resolved.service} />;
    case 'matter':
      return (
        <MatterView
          service={resolved.service}
          subService={resolved.subService}
          subSlug={resolved.subSlug}
        />
      );
    case 'city-service':
      return <CityServiceView city={resolved.city} service={resolved.service} />;
    case 'city-matter':
      return (
        <CityMatterView
          city={resolved.city}
          service={resolved.service}
          subService={resolved.subService}
          subSlug={resolved.subSlug}
        />
      );
    default:
      notFound();
  }
}
