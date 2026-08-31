import { notFound, permanentRedirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { SITE } from '@/constants/site';
import {
  resolveAdvocateByParam,
  getRelatedAdvocates,
  getAllAdvocateParams,
} from '@/lib/advocates';
import AdvocateProfileBody from '@/components/profile/AdvocateProfileBody';

// Prebuild every known lawyer profile at build time; new slugs render
// on-demand and are then cached (ISR). Data is tag-cached, so edits show up
// immediately without a full rebuild.
export const revalidate = 3600;

export async function generateStaticParams() {
  const params = await getAllAdvocateParams();
  return params.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const advocate = await resolveAdvocateByParam(slug);
  if (!advocate) return createMetadata({ title: 'Lawyer Not Found', path: '/lawyers' });

  return createMetadata({
    title: `${advocate.name} — ${advocate.specializations?.[0] || 'Lawyer'} in ${advocate.city}`,
    description: `${advocate.name} is a verified lawyer in ${advocate.city} with ${advocate.experience}+ years of experience in ${advocate.specializations?.join(', ')}. View profile, reviews, office and contact details.`,
    path: `/lawyers/${advocate.profilePath}`,
    keywords: [`lawyer in ${advocate.city}`, advocate.legalCareId, ...(advocate.specializations || [])],
  });
}

/** JSON-LD structured data for richer search results. */
function buildSchema(advocate) {
  const url = new URL(`/lawyers/${advocate.profilePath}`, SITE.url).toString();

  const attorney = {
    '@type': 'Attorney',
    '@id': `${url}#attorney`,
    identifier: advocate.legalCareId,
    name: advocate.name,
    description: advocate.about,
    telephone: advocate.contact?.phone,
    email: advocate.contact?.email,
    url,
    image: advocate.photo ? new URL(advocate.photo, SITE.url).toString() : undefined,
    areaServed: advocate.city,
    knowsLanguage: advocate.languages,
    knowsAbout: advocate.specializations,
    priceRange: advocate.consultationFee ? `₹${advocate.consultationFee}` : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: advocate.office?.address,
      addressLocality: advocate.city,
      addressRegion: advocate.state,
      postalCode: advocate.office?.pincode,
      addressCountry: 'IN',
    },
    ...(advocate.reviews
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: advocate.rating,
            reviewCount: advocate.reviews,
          },
        }
      : {}),
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
      { '@type': 'ListItem', position: 2, name: 'Find Lawyers', item: new URL('/lawyers', SITE.url).toString() },
      { '@type': 'ListItem', position: 3, name: advocate.name, item: url },
    ],
  };

  const graph = [attorney, breadcrumb];

  if (advocate.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: advocate.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export default async function AdvocateProfilePage({ params }) {
  const { slug: param } = await params;
  const advocate = await resolveAdvocateByParam(param);
  if (!advocate) notFound();

  // Profiles awaiting admin approval are not public yet — treat as not found
  // until an admin publishes them. Admins preview them at
  // /admin/advocates/<id>/preview instead: reading the admin cookie here would
  // make this route dynamic and cost every published profile its prerender.
  if (advocate.status !== 'published') notFound();

  // Enforce a single canonical URL — legacy or renamed-slug URLs 308-redirect
  // to `<slug>-lci-<id>`, so there are never duplicate profile URLs.
  if (param !== advocate.profilePath) {
    permanentRedirect(`/lawyers/${advocate.profilePath}`);
  }

  const related = getRelatedAdvocates(advocate, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSchema(advocate)) }}
      />

      <AdvocateProfileBody advocate={advocate} related={related} />
    </>
  );
}
