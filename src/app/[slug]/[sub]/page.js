import { notFound, permanentRedirect } from 'next/navigation';
import { matterPath, cityServicePath } from '@/lib/serviceRoutes';
import { getCityBySlug } from '@/lib/cities';
import {
  getServiceByAnySlug,
  getSubServiceByAnySlug,
  getSubSlug,
} from '@/data/categories';

/**
 * Nothing on the site is two segments deep any more — a matter lives at
 * `/[matter]-lawyer`, not under its category. This route only catches the two
 * retired shapes and permanently redirects them:
 *
 *   /criminal-lawyer/bail-matters → /bail-matters-lawyer
 *   /mumbai/criminal-law          → /criminal-lawyer-in-mumbai
 */
export default async function LegacyTwoSegmentRedirect({ params }) {
  const { slug, sub } = await params;

  // A category followed by one of its matters.
  const service = getServiceByAnySlug(slug);
  if (service) {
    const subService = getSubServiceByAnySlug(service.name, sub);
    if (subService) permanentRedirect(matterPath(getSubSlug(service.name, subService)));
  }

  // The old city-first form.
  const city = await getCityBySlug(slug);
  const cityService = city && getServiceByAnySlug(sub);
  if (cityService) permanentRedirect(cityServicePath(cityService, city));

  notFound();
}
