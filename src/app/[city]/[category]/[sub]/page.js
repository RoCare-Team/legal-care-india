import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, ShieldCheck, MessageSquare, BadgeIndianRupee, Users, Scale, MapPin,
} from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container, Card } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import AdvocateListing from '@/components/listing/AdvocateListing';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import { serviceSchema, breadcrumbSchema } from '@/lib/schema';
import { getAllAdvocates } from '@/lib/advocates';
import { getAllCities, getCityBySlug } from '@/lib/cities';
import { getServiceBySlug, getSubServiceBySlug, getSubServiceLinks } from '@/data/categories';
import { pluralize } from '@/utils/formatters';

// City → service → matter combos render on demand (dynamicParams defaults to
// true) and cache. Lawyer data is tag-cached so new registrations show at once.
export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { city: citySlug, category: catSlug, sub } = await params;
  const city = await getCityBySlug(citySlug);
  const service = getServiceBySlug(catSlug);
  const subService = service && getSubServiceBySlug(service.name, sub);
  if (!city || !service || !subService) {
    return createMetadata({ title: 'Not Found', path: '/cities' });
  }

  return createMetadata({
    title: `${subService} Lawyers in ${city.name}`,
    description: `Find verified ${subService} lawyers in ${city.name}, ${city.state} (${service.name}). Compare experience, fees and contact them directly.`,
    path: `/${city.slug}/${service.slug}/${sub}`,
    keywords: [
      `${subService} lawyer in ${city.name}`,
      `${subService} lawyer ${city.name}`,
      `${service.name} lawyer ${city.name}`,
    ],
  });
}

const TRUST = [
  { icon: ShieldCheck, label: 'Verified lawyers' },
  { icon: MessageSquare, label: 'Contact directly' },
  { icon: BadgeIndianRupee, label: 'Transparent fees' },
];

export default async function CityCategorySubPage({ params }) {
  const { city: citySlug, category: catSlug, sub } = await params;
  const city = await getCityBySlug(citySlug);
  const service = getServiceBySlug(catSlug);
  const subService = service && getSubServiceBySlug(service.name, sub);
  if (!city || !service || !subService) notFound();

  const Icon = service.icon;

  // Lawyers who practise this specific matter AND are based in this city.
  const allAdvocates = await getAllAdvocates();
  const advocates = allAdvocates.filter(
    (a) => a.subSpecializations?.includes(subService) && a.city === city.name
  );

  // Same matter in other cities; other matters in this city.
  const otherCities = (await getAllCities()).filter((c) => c.slug !== city.slug).slice(0, 8);
  const siblings = getSubServiceLinks(service.name).filter((s) => s.slug !== sub).slice(0, 8);

  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            name: `${subService} in ${city.name}`,
            slug: `${city.slug}/${service.slug}/${sub}`,
            description: `${subService} legal matters in ${city.name}`,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Cities', path: '/cities' },
            { name: city.name, path: `/${city.slug}` },
            { name: service.name, path: `/${city.slug}/${service.slug}` },
            { name: subService, path: `/${city.slug}/${service.slug}/${sub}` },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={`${service.name} · ${city.name}`}
        title={`${subService} Lawyers in ${city.name}`}
        subtitle={`Verified lawyers who handle ${subService} matters in ${city.name}, ${city.state}. Compare experience, fees and contact them directly.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Cities', href: '/cities' },
          { label: city.name, href: `/${city.slug}` },
          { label: service.name, href: `/${city.slug}/${service.slug}` },
          { label: subService },
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
                    href={`/${city.slug}/${service.slug}`}
                    className="text-xs font-semibold uppercase tracking-wider text-accent hover:underline"
                  >
                    {service.name} · {city.name}
                  </Link>
                  <h2 className="font-display text-2xl font-bold text-ink">
                    {subService} in {city.name}
                  </h2>
                </div>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-ink/70">
                Looking for a <span className="font-medium text-ink">{subService}</span> lawyer in{' '}
                {city.name}? Legal Care India connects you with verified lawyers in {city.name},{' '}
                {city.state} who specialise in {subService} matters under {service.name}. Compare
                their experience, ratings and consultation fees, then reach out directly.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {TRUST.map(({ icon: TrustIcon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-3.5 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-ink/5"
                  >
                    <TrustIcon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
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
                    <dd className="font-semibold text-ink">{advocates.length}</dd>
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
                    <Scale className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">Practice area</dt>
                    <dd className="font-semibold text-ink">
                      <Link href={`/${city.slug}/${service.slug}`} className="hover:text-primary">
                        {service.name}
                      </Link>
                    </dd>
                  </div>
                </div>
              </dl>
            </Card>
          </div>
        </SectionReveal>

        {/* ── Lawyers ─────────────────────────────────────────────── */}
        <div className="mt-14">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-semibold text-ink">
              {advocates.length > 0
                ? `${pluralize(advocates.length, 'lawyer')} for ${subService} in ${city.name}`
                : `${subService} Lawyers in ${city.name}`}
            </h2>
            <Link
              href={`/legal-services/${service.slug}/${sub}`}
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
              emptyTitle={`No ${subService} lawyers in ${city.name} yet`}
              emptyMessage={`No lawyer has listed ${subService} in ${city.name} so far. Browse ${subService} lawyers in all cities, or explore all lawyers in ${city.name}.`}
              emptyAction={
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href={`/legal-services/${service.slug}/${sub}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
                  >
                    {subService} · all cities
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

        {/* ── Same matter in other cities ───────────────────────────── */}
        {otherCities.length > 0 && (
          <SectionReveal>
            <div className="mt-14 rounded-3xl border border-ink/8 bg-muted/40 p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-ink">
                {subService} lawyers in other cities
              </h2>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {otherCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}/${service.slug}/${sub}`}
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

        {/* ── Other matters in this city ────────────────────────────── */}
        {siblings.length > 0 && (
          <SectionReveal>
            <div className="mt-10">
              <h2 className="mb-5 font-display text-xl font-semibold text-ink">
                Other {service.name} matters in {city.name}
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {siblings.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/${city.slug}/${service.slug}/${s.slug}`}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-surface px-4 py-2 text-sm font-medium text-ink/75 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
                  >
                    {s.name}
                    <ArrowRight className="h-3.5 w-3.5 text-ink/25 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
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
