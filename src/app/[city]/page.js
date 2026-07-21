import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight, ChevronDown, ShieldCheck, MessageSquare, BadgeIndianRupee,
  Users, MapPin, Building2,
} from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container, Card } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import AdvocateListing from '@/components/listing/AdvocateListing';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import { breadcrumbSchema, faqSchema, webPageSchema } from '@/lib/schema';
import { getAllAdvocates } from '@/lib/advocates';
import { getAllCities, getCityBySlug } from '@/lib/cities';
import { CATEGORIES } from '@/data/categories';
import { pluralize } from '@/utils/formatters';

// Prerender the curated/known cities; any other real city renders on demand
// (dynamicParams defaults to true) and is cached. Lawyer data is tag-cached
// so new registrations appear immediately (see lib/lawyers).
export const revalidate = 3600;

export async function generateStaticParams() {
  const cities = await getAllCities();
  return cities.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }) {
  const { city: slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return createMetadata({ title: 'City Not Found', path: '/cities' });

  return createMetadata({
    title: `Lawyers in ${city.name}`,
    description: `Find and connect with verified lawyers in ${city.name}, ${city.state}. Search by legal service, compare experience and contact them directly.`,
    path: `/${city.slug}`,
    keywords: [`lawyers in ${city.name}`, `lawyers in ${city.name}`, `${city.name} lawyer`],
  });
}

const WHY_POINTS = [
  {
    icon: ShieldCheck,
    title: 'Verified lawyers',
    text: 'Every profile is registered and reviewed — you connect only with genuine, practising lawyers.',
  },
  {
    icon: MessageSquare,
    title: 'Contact directly',
    text: 'Call, WhatsApp or email the lawyer yourself. No middlemen, no commission on your case.',
  },
  {
    icon: BadgeIndianRupee,
    title: 'Transparent fees',
    text: 'Consultation fees are listed upfront on each profile, so you choose what fits your budget.',
  },
];

function buildFaqs(city, count) {
  return [
    {
      q: `How do I find a good lawyer in ${city.name}?`,
      a: `Browse verified lawyers in ${city.name} on Legal Care India, filter by legal service, compare their experience, ratings and consultation fees, and contact the right one directly.`,
    },
    {
      q: `How many lawyers are listed in ${city.name}?`,
      a: count > 0
        ? `There ${count === 1 ? 'is' : 'are'} currently ${pluralize(count, 'verified lawyer')} listed in ${city.name}, across a range of legal services.`
        : `Lawyers are being onboarded in ${city.name}. New verified profiles appear here as soon as they register.`,
    },
    {
      q: `Is contacting a lawyer in ${city.name} free?`,
      a: 'Yes. Browsing profiles and contacting lawyers is completely free. You only pay the lawyer directly for their consultation or case work.',
    },
  ];
}

export default async function CityPage({ params }) {
  const { city: slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const allAdvocates = await getAllAdvocates();
  const inCity = allAdvocates.filter((a) => a.city === city.name);
  const count = inCity.length;
  const faqs = buildFaqs(city, count);

  // Other cities to explore.
  const otherCities = (await getAllCities()).filter((c) => c.slug !== city.slug).slice(0, 8);

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            name: `Lawyers in ${city.name}`,
            description: `Verified lawyers in ${city.name}, ${city.state}.`,
            path: `/${city.slug}`,
          }),
          faqSchema(faqs),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Cities', path: '/cities' },
            { name: city.name, path: `/${city.slug}` },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={count > 0 ? `${pluralize(count, 'lawyer')} available` : `${city.state}`}
        title={`Lawyers in ${city.name}`}
        subtitle={`Discover verified lawyers across ${city.name}, ${city.state} and reach them directly by call, WhatsApp or email.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Cities', href: '/cities' },
          { label: city.name },
        ]}
      />

      <Container className="py-10 sm:py-14">
        {/* ── Intro + quick facts ───────────────────────────────────── */}
        <SectionReveal>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white ring-1 ring-primary/20">
                  <MapPin className="h-7 w-7" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                    {city.state}
                  </p>
                  <h2 className="font-display text-2xl font-bold text-ink">{city.name}</h2>
                </div>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-ink/70">
                Looking for a lawyer in {city.name}? Legal Care India helps you find and connect
                with verified lawyers across {city.name}, {city.state} — covering civil, criminal,
                family, property, corporate and many other legal matters. Compare experience,
                ratings and fees, then reach out directly.
              </p>
            </div>

            {/* Quick facts card */}
            <Card className="h-full bg-gradient-to-br from-muted/60 to-surface">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">
                At a glance
              </p>
              <dl className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">Lawyers available</dt>
                    <dd className="font-semibold text-ink">{count}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">State</dt>
                    <dd className="font-semibold text-ink">{city.state}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">Verified profiles</dt>
                    <dd className="font-semibold text-ink">Yes · free to contact</dd>
                  </div>
                </div>
              </dl>
            </Card>
          </div>
        </SectionReveal>

        {/* ── Legal services in this city ───────────────────────────── */}
        <SectionReveal>
          <div className="mt-14">
            <h2 className="font-display text-xl font-semibold text-ink">
              Legal services in {city.name}
            </h2>
            <p className="mt-1.5 text-sm text-ink/55">
              Browse lawyers by the type of legal matter you need help with.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((c) => {
                const CatIcon = c.icon;
                return (
                  <Card
                    key={c.slug}
                    as={Link}
                    href={`/${city.slug}/${c.slug}`}
                    hoverable
                    padding="none"
                    className="group flex items-center justify-between gap-3 p-4 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                        <CatIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-medium text-ink">{c.name}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink/20 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Card>
                );
              })}
            </div>
          </div>
        </SectionReveal>

        {/* ── Lawyers in this city ────────────────────────────────── */}
        <div className="mt-14">
          <h2 className="mb-5 font-display text-xl font-semibold text-ink">
            Lawyers in {city.name}
          </h2>
          <AdvocateListing
            advocates={allAdvocates}
            initial={{ city: city.name }}
            emptyTitle={`No lawyers in ${city.name} yet`}
            emptyMessage={`No verified lawyer has registered in ${city.name} so far. Explore lawyers in nearby cities or check back soon.`}
            emptyAction={
              <Link
                href="/lawyers"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
              >
                Browse all lawyers
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
        </div>

        {/* ── Why choose ────────────────────────────────────────────── */}
        <SectionReveal>
          <div className="mt-14 rounded-3xl border border-ink/8 bg-muted/40 p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-ink">
              Why find your {city.name} lawyer here
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {WHY_POINTS.map(({ icon: PointIcon, title, text }) => (
                <div key={title} className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-primary shadow-sm ring-1 ring-ink/5">
                    <PointIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/60">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>

        {/* ── FAQs ──────────────────────────────────────────────────── */}
        <SectionReveal>
          <div className="mt-14">
            <h2 className="mb-5 font-display text-xl font-semibold text-ink">
              Lawyers in {city.name} — FAQs
            </h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-ink/8 bg-surface px-5 py-4 shadow-sm [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-ink">
                    {faq.q}
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-ink/40 transition-transform duration-300 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink/65">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </SectionReveal>

        {/* ── Other cities ──────────────────────────────────────────── */}
        {otherCities.length > 0 && (
          <SectionReveal>
            <div className="mt-14">
              <h2 className="mb-5 font-display text-xl font-semibold text-ink">
                Lawyers in other cities
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {otherCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}`}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-surface px-4 py-2 text-sm font-medium text-ink/75 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </SectionReveal>
        )}
      </Container>
    </>
  );
}
