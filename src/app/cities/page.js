import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import CityCard from '@/components/cards/CityCard';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import { FaqList } from '@/components/views/sections/ContentSections';
import { SeoSection, LinkCardGrid } from '@/components/shared/SeoSection';
import { breadcrumbSchema, faqSchema, webPageSchema } from '@/lib/schema';
import { getAllCities } from '@/lib/cities';
import { getLawyerCountsByCity } from '@/lib/stats';

export const metadata = createMetadata({
  title: 'Find Lawyers by City in India',
  description:
    'Browse verified lawyers city by city across India — Delhi, Mumbai, Bengaluru, Hyderabad, Gurugram and more. Compare experience and consult online.',
  path: '/cities',
  keywords: [
    'lawyers by city india',
    'find advocate in my city',
    'local lawyers india',
    'lawyer near me',
    'city wise lawyer directory',
  ],
});

/**
 * Why the city matters at all — the question a page of city tiles raises and
 * does not answer. Each row links somewhere real.
 */
const WHY_CITY = [
  {
    href: '/lawyers',
    title: 'Courts are local',
    text: 'A matter is filed where the cause of action arose or where the parties live. A lawyer who appears in that court already knows its listing habits, its registry and its judges.',
  },
  {
    href: '/legal-services',
    title: 'Local law differs',
    text: 'Stamp duty, registration, rent control, land records and police procedure are state subjects. What is routine in one state is filed differently in the next.',
  },
  {
    href: '/lawyers',
    title: 'Meeting in person still helps',
    text: 'Advice travels; documents and signatures often do not. Every profile lists the office address, so you can start online and meet later if the matter needs it.',
  },
];

/**
 * The same questions and answers rendered on the page below — FAQ schema is
 * only added for FAQs a visitor can actually read.
 */
const FAQS = [
  {
    q: 'Should I choose a lawyer from my own city?',
    a: 'For advice, a document review or a second opinion, the city does not matter — a consultation by chat, call or video works from anywhere. For a case that has to be filed and argued, a lawyer who practises in the relevant court is usually worth choosing, which is why each profile lists the courts that lawyer appears in.',
  },
  {
    q: 'My city is not listed. Can I still find a lawyer?',
    a: 'Yes. The city pages cover the places with lawyers registered on Justiceland so far, but the directory itself can be searched and filtered without picking a city at all, and many lawyers also list the other cities they take work in. As lawyers register in more places, those cities appear here.',
  },
  {
    q: 'How do I find a lawyer for a specific area of law in my city?',
    a: 'Open your city and pick the practice area from there, or go the other way — open the practice area and narrow it to your city. Both routes lead to the same page, for example property lawyers in Gurugram or criminal lawyers in Delhi.',
  },
];

export default async function CitiesPage() {
  const [CITIES, counts] = await Promise.all([getAllCities(), getLawyerCountsByCity()]);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Cities', path: '/cities' },
          ]),
          webPageSchema({
            name: 'Find Lawyers by City in India',
            description: 'Verified lawyers city by city across India.',
            path: '/cities',
          }),
          faqSchema(FAQS),
        ]}
      />
      <PageHeader
        eyebrow="Browse by City"
        title="Find Lawyers in Your City"
        subtitle="Select a city to discover verified lawyers near you and connect with them directly."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Cities' }]}
      />
      <Container className="py-10 sm:py-12">
        <SectionReveal>
          <section>
            <h2 className="font-display text-2xl font-bold text-ink">
              Browse Lawyers by City
            </h2>
            <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink/60">
              Every city below has lawyers registered on Justiceland. Open one to see who
              practises there, the areas they take and what they charge per minute.
            </p>

            {/* Compact city tiles — six across on a wide screen, matching the
                homepage slider rather than the old four large photo panels. */}
            {/* This page shows every city, so it wraps rather than scrolling. */}
            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
              {CITIES.map((city, i) => (
                <SectionReveal key={city.slug} delay={i * 0.04}>
                  <CityCard city={city} count={counts[city.name] || 0} />
                </SectionReveal>
              ))}
            </div>
          </section>
        </SectionReveal>

        <SeoSection
          title="Why the City Matters"
          lead="Legal advice travels well. Litigation does not — and the difference decides how much the city should weigh in your choice."
        >
          <LinkCardGrid items={WHY_CITY} columns={3} />
        </SeoSection>

        <FaqList title="Frequently Asked Questions" faqs={FAQS} />
      </Container>
    </>
  );
}
