import { notFound, permanentRedirect } from 'next/navigation';
import { matterPath } from '@/lib/serviceRoutes';
import { getServiceByAnySlug, getSubServiceByAnySlug, getSubSlug } from '@/data/categories';

// Matter pages now live at `/[service]/[matter]`; this old path only redirects.
export default async function LegacyMatterRedirect({ params }) {
  const { slug, sub } = await params;
  const service = getServiceByAnySlug(slug);
  const subService = service && getSubServiceByAnySlug(service.name, sub);
  if (!subService) notFound();
  permanentRedirect(matterPath(getSubSlug(service.name, subService)));
}
