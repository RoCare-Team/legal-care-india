import { notFound, permanentRedirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { SITE } from '@/constants/site';
import {
  resolveAdvocateByParam,
  getRelatedAdvocates,
  getAllAdvocateParams,
  advocatePhotoUrl,
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

/**
 * The profile with its stored images swapped for the URLs that serve them.
 *
 * A lawyer's photo and office gallery are kept in the database as base64 data
 * URIs. Rendered as they are, every one of them was written into the page's
 * HTML, and again into the data React hydrates from — a profile with a photo
 * and two office pictures came to 2.3 MB before anything could be shown, which
 * on a phone is most of the wait. The photo and gallery routes serve the same
 * bytes as separate, cacheable images that load after the page.
 *
 * The cover image is dropped outright: the profile no longer shows one.
 *
 * Only for this public page. The admin preview renders unapproved profiles,
 * whose images those routes rightly refuse to serve, so it keeps the inline
 * data.
 */
function withImageUrls(advocate) {
  const inline = (value) => typeof value === 'string' && value.startsWith('data:');
  const id = String(advocate._id);
  return {
    ...advocate,
    photo: inline(advocate.photo) ? advocatePhotoUrl(id) : advocate.photo,
    coverImage: inline(advocate.coverImage) ? '' : advocate.coverImage,
    gallery: (advocate.gallery || []).map((item, i) =>
      item && inline(item.url) ? { ...item, url: `/api/advocates/${id}/gallery/${i}` } : item
    ),
  };
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
  const profile = withImageUrls(advocate);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSchema(profile)) }}
      />

      <AdvocateProfileBody advocate={profile} related={related} />
    </>
  );
}
