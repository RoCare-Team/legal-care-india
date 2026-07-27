import { notFound, permanentRedirect } from 'next/navigation';
import { cityMatterPath } from '@/lib/serviceRoutes';
import { getCityBySlug } from '@/lib/cities';
import { getServiceByAnySlug, getSubServiceByAnySlug, getSubSlug } from '@/data/categories';

/**
 * Nothing on the site is three segments deep any more. This route exists only
 * to catch the retired `/[city]/[category]/[matter]` URLs and permanently
 * redirect them to the current one-segment form.
 */
export default async function LegacyCityMatterRedirect({ params }) {
  const { slug, sub, third } = await params;

  const city = await getCityBySlug(slug);
  const service = city && getServiceByAnySlug(sub);
  const subService = service && getSubServiceByAnySlug(service.name, third);
  if (!subService) notFound();

  permanentRedirect(cityMatterPath(getSubSlug(service.name, subService), city));
}
