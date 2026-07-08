import { notFound } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { SITE } from '@/constants/site';
import { Container } from '@/components/ui';
import { getAdvocateBySlug, getRelatedAdvocates, getAllAdvocateSlugs } from '@/lib/advocates';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileContactCard from '@/components/profile/ProfileContactCard';
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfileLegalServices from '@/components/profile/ProfileLegalServices';
import ProfileEducation from '@/components/profile/ProfileEducation';
import ProfileOffice from '@/components/profile/ProfileOffice';
import ProfileGallery from '@/components/profile/ProfileGallery';
import ProfileCredentials from '@/components/profile/ProfileCredentials';
import ProfileReviews from '@/components/profile/ProfileReviews';
import ProfileFaq from '@/components/profile/ProfileFaq';
import ProfileMobileBar from '@/components/profile/ProfileMobileBar';
import RelatedAdvocates from '@/components/profile/RelatedAdvocates';

// Prebuild every known advocate profile at build time; new slugs render
// on-demand and are then cached (ISR). Data is tag-cached, so edits show up
// immediately without a full rebuild.
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllAdvocateSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const advocate = await getAdvocateBySlug(slug);
  if (!advocate) return createMetadata({ title: 'Advocate Not Found', path: '/advocates' });

  return createMetadata({
    title: `${advocate.name} — ${advocate.specializations?.[0] || 'Advocate'} in ${advocate.city}`,
    description: `${advocate.name} is a verified advocate in ${advocate.city} with ${advocate.experience}+ years of experience in ${advocate.specializations?.join(', ')}. View profile, reviews, office and contact details.`,
    path: `/advocates/${advocate.slug}`,
    keywords: [`advocate in ${advocate.city}`, ...(advocate.specializations || [])],
  });
}

/** JSON-LD structured data for richer search results. */
function buildSchema(advocate) {
  const url = new URL(`/advocates/${advocate.slug}`, SITE.url).toString();

  const attorney = {
    '@type': 'Attorney',
    '@id': `${url}#attorney`,
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
      { '@type': 'ListItem', position: 2, name: 'Find Advocates', item: new URL('/advocates', SITE.url).toString() },
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
  const { slug } = await params;
  const advocate = await getAdvocateBySlug(slug);
  if (!advocate) notFound();

  const related = getRelatedAdvocates(advocate, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSchema(advocate)) }}
      />

      <Container className="py-6 pb-28 sm:py-8 lg:pb-8">
        <ProfileHeader advocate={advocate} />

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ProfileAbout advocate={advocate} />
            <ProfileLegalServices advocate={advocate} />
            <ProfileEducation advocate={advocate} />
            <ProfileOffice advocate={advocate} />
            <ProfileGallery advocate={advocate} />
            <ProfileCredentials advocate={advocate} />
            <ProfileReviews advocate={advocate} />
            <ProfileFaq advocate={advocate} />
          </div>

          <div className="lg:col-span-1">
            <ProfileContactCard advocate={advocate} />
          </div>
        </div>
      </Container>

      <RelatedAdvocates advocates={related} />
      <ProfileMobileBar advocate={advocate} />
    </>
  );
}
