import { redirect } from 'next/navigation';

// City-scoped matter pages are now city-first: `/[city]/[category]/[sub]`
// (e.g. /mumbai/property-law/property-registration). Old city-last links
// permanently redirect to the new canonical URL.
export default async function LegacyMatterCityRedirect({ params }) {
  const { slug, sub, city } = await params;
  redirect(`/${city}/${slug}/${sub}`);
}
