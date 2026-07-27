import { notFound, permanentRedirect } from 'next/navigation';
import { cityMatterPath } from '@/lib/serviceRoutes';
import { getCityBySlug } from '@/lib/cities';
import { getServiceByAnySlug, getSubServiceByAnySlug, getSubSlug } from '@/data/categories';

// City-scoped matter pages are now a single segment
// (`/bail-matters-lawyer-in-mumbai`). This old city-last path only redirects.
export default async function LegacyMatterCityRedirect({ params }) {
  const { slug, sub, city: citySlug } = await params;

  const city = await getCityBySlug(citySlug);
  const service = getServiceByAnySlug(slug);
  const subService = service && getSubServiceByAnySlug(service.name, sub);
  if (!city || !subService) notFound();

  permanentRedirect(cityMatterPath(getSubSlug(service.name, subService), city));
}
