import { notFound, permanentRedirect } from 'next/navigation';
import { servicePath } from '@/lib/serviceRoutes';
import { getServiceByAnySlug } from '@/data/categories';

// Legal-service pages now live at the root (`/criminal-lawyer`), so this old
// path only redirects. It also accepts the retired `-law` slugs.
export default async function LegacyServiceRedirect({ params }) {
  const { slug } = await params;
  const service = getServiceByAnySlug(slug);
  if (!service) notFound();
  permanentRedirect(servicePath(service));
}
