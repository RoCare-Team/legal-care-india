import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, ChevronDown, ShieldCheck, MessageSquare, BadgeIndianRupee,
  Users, Layers, MapPin, Sparkles,
} from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container, Card } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import AdvocateListing from '@/components/listing/AdvocateListing';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import { serviceSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { getAllAdvocates } from '@/lib/advocates';
import { getCityBySlug } from '@/lib/cities';
import { getServiceBySlug, getSubServiceLinks, CATEGORIES } from '@/data/categories';
import { pluralize } from '@/utils/formatters';

// City + legal-service combos render on demand (dynamicParams defaults to true)
// and cache. Lawyer data is tag-cached so new registrations appear at once.
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { city: citySlug, category: catSlug } = await params;
  const city = await getCityBySlug(citySlug);
  const service = getServiceBySlug(catSlug);
  if (!city || !service) return createMetadata({ title: 'Not Found', path: '/cities' });

  return createMetadata({
    title: `${service.name} Lawyers in ${city.name}`,
    description: `Find verified ${service.name} lawyers in ${city.name}, ${city.state}. ${service.description} Compare experience and contact them directly.`,
    path: `/${city.slug}/${service.slug}`,
    keywords: [
      `${service.name} lawyer in ${city.name}`,
      `${service.name} lawyer ${city.name}`,
    ],
  });
}

const WHY_POINTS = [
  { icon: ShieldCheck, title: 'Verified lawyers', text: 'Every profile is registered and reviewed — you connect only with genuine, practising lawyers.' },
  { icon: MessageSquare, title: 'Contact directly', text: 'Call, WhatsApp or email the lawyer yourself. No middlemen, no commission on your case.' },
  { icon: BadgeIndianRupee, title: 'Transparent fees', text: 'Consultation fees are listed upfront on each profile, so you choose what fits your budget.' },
];

function buildFaqs(service, city, count) {
  return [
    {
      q: `How do I find a good ${service.name} lawyer in ${city.name}?`,
      a: `Browse verified ${service.name} lawyers in ${city.name} on Legal Care India, compare their experience, ratings and consultation fees, and contact the right one directly.`,
    },
    {
      q: `How many ${service.name} lawyers are in ${city.name}?`,
      a: count > 0
        ? `There ${count === 1 ? 'is' : 'are'} currently ${pluralize(count, `${service.name} lawyer`)} listed in ${city.name}.`
        : `${service.name} lawyers are being onboarded in ${city.name}. New verified profiles appear here as they register.`,
    },
    {
      q: `Is contacting a ${service.name} lawyer in ${city.name} free?`,
      a: 'Yes. Browsing profiles and contacting lawyers is completely free. You only pay the lawyer directly for their consultation or case work.',
    },
  ];
}

export default async function CityCategoryPage({ params }) {
  const { city: citySlug, category: catSlug } = await params;
  const city = await getCityBySlug(citySlug);
  const service = getServiceBySlug(catSlug);
  if (!city || !service) notFound();

  const Icon = service.icon;
  const subServices = getSubServiceLinks(service.name);
  const faqs = buildFaqs(service, city, 0);

  // Lawyers practising this service AND based in this city.
  const allAdvocates = await getAllAdvocates();
  const advocates = allAdvocates.filter(
    (a) => a.specializations?.includes(service.name) && a.city === city.name
  );
  const count = advocates.length;
  faqs[1].a = count > 0
    ? `There ${count === 1 ? 'is' : 'are'} currently ${pluralize(count, `${service.name} lawyer`)} listed in ${city.name}.`
    : `${service.name} lawyers are being onboarded in ${city.name}. New verified profiles appear here as they register.`;

  // Other legal services in the same city.
  const otherServices = CATEGORIES.filter((c) => c.slug !== service.slug).slice(0, 6);

  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            name: `${service.name} in ${city.name}`,
            slug: `${city.slug}/${service.slug}`,
            description: `${service.name} lawyers in ${city.name}`,
          }),
          faqSchema(faqs),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Cities', path: '/cities' },
            { name: city.name, path: `/${city.slug}` },
            { name: service.name, path: `/${city.slug}/${service.slug}` },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={count > 0 ? `${pluralize(count, 'lawyer')} available` : `${service.name} · ${city.state}`}
        title={`${service.name} Lawyers in ${city.name}`}
        subtitle={`Verified ${service.name} lawyers in ${city.name}, ${city.state}. ${service.description}`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Cities', href: '/cities' },
          { label: city.name, href: `/${city.slug}` },
          { label: service.name },
        ]}
      />

      <Container className="py-10 sm:py-14">
        {/* ── Intro + quick facts ───────────────────────────────────── */}
        <SectionReveal>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white ring-1 ring-primary/20">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <div>
                  <Link
                    href={`/${city.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-accent hover:underline"
                  >
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {city.name}, {city.state}
                  </Link>
                  <h2 className="font-display text-2xl font-bold text-ink">
                    {service.name} in {city.name}
                  </h2>
                </div>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-ink/70">
                {service.overview || service.description} Find and connect with verified{' '}
                {service.name} lawyers in {city.name}, {city.state} — compare experience, ratings
                and fees, then reach out directly.
              </p>
            </div>

            {/* Quick facts card */}
            <Card className="h-full bg-gradient-to-br from-muted/60 to-surface">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">At a glance</p>
              <dl className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">Lawyers here</dt>
                    <dd className="font-semibold text-ink">{count}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">City</dt>
                    <dd className="font-semibold text-ink">
                      <Link href={`/${city.slug}`} className="hover:text-primary">
                        {city.name}, {city.state}
                      </Link>
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Layers className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">Matters covered</dt>
                    <dd className="font-semibold text-ink">{subServices.length}</dd>
                  </div>
                </div>
              </dl>
            </Card>
          </div>
        </SectionReveal>

        {/* ── Matters (city-scoped) ─────────────────────────────────── */}
        {subServices.length > 0 && (
          <SectionReveal>
            <div className="mt-14">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="font-display text-xl font-semibold text-ink">
                  {service.name} matters in {city.name}
                </h2>
              </div>
              <p className="mt-1.5 text-sm text-ink/55">
                Tap a matter to see lawyers in {city.name} who handle exactly that.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subServices.map((item) => (
                  <Card
                    key={item.slug}
                    as={Link}
                    href={`/${city.slug}/${service.slug}/${item.slug}`}
                    hoverable
                    padding="none"
                    className="group flex items-center justify-between gap-3 p-4 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-medium text-ink">{item.name}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink/20 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Card>
                ))}
              </div>
            </div>
          </SectionReveal>
        )}

        {/* ── Lawyers ─────────────────────────────────────────────── */}
        <div className="mt-14">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-semibold text-ink">
              {count > 0
                ? `${pluralize(count, 'lawyer')} for ${service.name} in ${city.name}`
                : `${service.name} Lawyers in ${city.name}`}
            </h2>
            <Link
              href={`/legal-services/${service.slug}`}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All cities
            </Link>
          </div>
          <div className="mt-5">
            <AdvocateListing
              advocates={advocates}
              showFilters={false}
              emptyTitle={`No ${service.name} lawyers in ${city.name} yet`}
              emptyMessage={`No verified ${service.name} lawyer has registered in ${city.name} so far. Explore ${service.name} lawyers in all cities, or all lawyers in ${city.name}.`}
              emptyAction={
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href={`/legal-services/${service.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
                  >
                    {service.name} · all cities
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href={`/${city.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    All lawyers in {city.name}
                  </Link>
                </div>
              }
            />
          </div>
        </div>

        {/* ── Why choose ────────────────────────────────────────────── */}
        <SectionReveal>
          <div className="mt-14 rounded-3xl border border-ink/8 bg-muted/40 p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-ink">
              Why find your {service.name} lawyer in {city.name} here
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
              {service.name} in {city.name} — FAQs
            </h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-2xl border border-ink/8 bg-surface px-5 py-4 shadow-sm [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-ink">
                    {faq.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-ink/40 transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink/65">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </SectionReveal>

        {/* ── Other legal services in this city ─────────────────────── */}
        <SectionReveal>
          <div className="mt-14">
            <h2 className="mb-5 font-display text-xl font-semibold text-ink">
              Other legal services in {city.name}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {otherServices.map((c) => {
                const RelIcon = c.icon;
                return (
                  <Card
                    key={c.slug}
                    as={Link}
                    href={`/${city.slug}/${c.slug}`}
                    hoverable
                    padding="none"
                    className="group flex flex-col items-center gap-2 p-4 text-center transition-all duration-300 hover:-translate-y-1"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-primary group-hover:text-white">
                      <RelIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-medium leading-tight text-ink/80">{c.name}</span>
                    <ArrowRight className="h-4 w-4 text-ink/20 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Card>
                );
              })}
            </div>
          </div>
        </SectionReveal>
      </Container>
    </>
  );
}
