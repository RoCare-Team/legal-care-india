import { createMetadata } from '@/lib/metadata';
import PageHeader from '@/components/shared/PageHeader';
import { Container } from '@/components/ui';
import AdvocateListing from '@/components/listing/AdvocateListing';
import JsonLd from '@/components/shared/JsonLd';
import { FaqList } from '@/components/views/sections/ContentSections';
import { SeoSection, LinkCardGrid, StepCards } from '@/components/shared/SeoSection';
import { breadcrumbSchema, collectionSchema, faqSchema } from '@/lib/schema';
import { getAllAdvocates } from '@/lib/advocates';
import { getServiceByAnySlug, getSubServiceByAnySlug } from '@/data/categories';
import { getAllCities } from '@/lib/cities';

export const metadata = createMetadata({
  title: 'Find Verified Lawyers in India',
  description:
    'Search verified lawyers across India by practice area, city, court and language. Compare experience and per-minute rates, then consult online in minutes.',
  path: '/lawyers',
  keywords: [
    'find a lawyer in india',
    'verified lawyers india',
    'lawyer directory india',
    'consult a lawyer online',
    'advocate near me',
  ],
});

/**
 * What a visitor needs after the list itself: how to narrow it, and what
 * happens once they have picked someone. A grid of cards answers neither.
 */
const CHOOSING = [
  {
    href: '/legal-services',
    title: 'Start from the practice area',
    text: 'A lawyer who is excellent on a property title is not the one you want for a bail application. Narrow by the area your matter belongs to before anything else.',
  },
  {
    href: '/cities',
    title: 'Check the city and the court',
    text: 'Litigation is local. A lawyer who appears regularly before the court your matter is filed in knows its listing habits and its registry — time nobody bills you for.',
  },
  {
    href: '/lawyers',
    title: 'Compare experience and rate',
    text: 'Every card shows years in practice and the per-minute rate for chat, audio and video. The most expensive lawyer is not automatically the right one for a half-hour question.',
  },
  {
    href: '/verification',
    title: 'Read what is actually stated',
    text: 'A profile shows what that lawyer has entered about their own practice — Bar Council enrolment, courts, languages, areas. Anything not supplied is left blank rather than filled in for them.',
  },
];

const STEPS = [
  {
    title: 'Filter the directory',
    text: 'By practice area, city, court, language or availability — or search by name if someone has been recommended to you.',
  },
  {
    title: 'Start a consultation',
    text: 'Chat, audio or video, whichever suits. Nothing is charged while you wait for the lawyer to accept; the clock starts when you connect.',
  },
  {
    title: 'Pay for the minutes used',
    text: 'The cost is counted as you talk and settled from your wallet at the end. Finish when your question is answered — there is no package to buy.',
  },
];

/**
 * The questions people ask before their first consultation. These are the same
 * ones rendered on the page below — the FAQ schema describes what is visible.
 */
const FAQS = [
  {
    q: 'How do I find the right lawyer for my case?',
    a: 'Narrow by practice area first, then by city or the court your matter is filed in, then compare experience and rate. If you are not sure which area your problem belongs to, the legal services page maps common situations — an unpaid invoice, a bounced cheque, a builder delay — to the lawyers who handle them.',
  },
  {
    q: 'What does a consultation cost?',
    a: 'Each lawyer sets their own rate per minute for chat, audio and video, shown on their card and profile before you start. You are billed only for the minutes the consultation actually runs, settled from your wallet when it ends. Nothing is added on top.',
  },
  {
    q: 'Can I consult a lawyer from a different city?',
    a: 'Yes. Advice, document review and a view on your options do not depend on where either of you is sitting. Where the city does matter is representation: a case filed in a particular court is usually best handled by someone who appears there, which is why every profile lists the courts that lawyer practises in.',
  },
  {
    q: 'Is my conversation with the lawyer private?',
    a: 'Yes. You can also switch on anonymous mode in your account, and the lawyer sees the consultation as coming from an anonymous client rather than your name. What you choose to share during the consultation is up to you.',
  },
  {
    q: 'What happens if the lawyer does not answer?',
    a: 'Nothing is charged. A consultation costs money only from the moment it connects, so a request that is declined or never answered costs nothing at all. Lawyers who are available right now are marked online, and you can filter the directory down to them.',
  },
];

// The page reads search filters (searchParams) so it renders per request, but
// the lawyer data itself is tag-cached — no MongoDB round-trip each visit.
export const revalidate = 3600;

/** Turn a slug back into a display name, e.g. "new-delhi" → "New Delhi". */
function deslugify(slug) {
  return String(slug)
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Resolve the query-string slugs coming from search into filter labels. */
function resolveInitial(params = {}, cities = []) {
  const initial = {};
  if (params.q) initial.query = String(params.q);
  if (params.service) {
    const svc = getServiceByAnySlug(String(params.service));
    if (svc) {
      initial.service = svc.name;
      // A sub-category only means anything inside its parent service, so it is
      // resolved against the service we just matched.
      if (params.sub) {
        const sub = getSubServiceByAnySlug(svc.name, String(params.sub));
        if (sub) initial.subService = sub;
      }
    }
  }
  if (params.city) {
    // Known cities resolve to their canonical name; anything else (e.g. a city
    // typed by hand that isn't in our list) still filters by its de-slugged name
    // so it can match a lawyer's practice cities.
    const slug = String(params.city);
    const city = cities.find((c) => c.slug === slug);
    initial.city = city ? city.name : deslugify(slug);
  }
  return initial;
}

export default async function AdvocatesPage({ searchParams }) {
  const params = await searchParams;
  const [advocates, cities] = await Promise.all([getAllAdvocates(), getAllCities()]);
  const initial = resolveInitial(params, cities);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Find Lawyers', path: '/lawyers' },
          ]),
          collectionSchema({
            name: 'Find Verified Lawyers Across India',
            path: '/lawyers',
            description:
              'Search and compare verified lawyers across India by legal service, city and experience.',
            advocates,
          }),
          faqSchema(FAQS),
        ]}
      />
      <PageHeader
        eyebrow="Lawyer Directory"
        title="Find Verified Lawyers Across India"
        subtitle="Browse trusted lawyers by legal service, city and experience — then call, WhatsApp or email them directly."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Find Lawyers' }]}
      />
      {/* Pull the filter/search bar up so it floats over the hero — the first
          thing a visitor reaches, clearly above the fold. */}
      <Container className="relative z-20 -mt-6 pb-10 sm:-mt-8 sm:pb-12">
        <AdvocateListing advocates={advocates} initial={initial} cities={cities} floatFilters />

        {/* Below the list, because the list is what the visitor came for — but
            on the page, because a directory with no explanation of how to read
            it is only useful to someone who already knows. */}
        <SeoSection
          title="How to Choose a Lawyer"
          lead="Four things worth checking before you start a consultation, in the order they usually matter."
        >
          <LinkCardGrid items={CHOOSING} />
        </SeoSection>

        <SeoSection
          title="How Consultations Work"
          lead="No appointment to book and no package to buy — you are charged for the minutes you actually use."
        >
          <StepCards steps={STEPS} />
        </SeoSection>

        <FaqList title="Frequently Asked Questions" faqs={FAQS} />
      </Container>
    </>
  );
}
