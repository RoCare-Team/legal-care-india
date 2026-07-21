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
import { getAllCities } from '@/lib/cities';
import {
  getServiceBySlug,
  getSubServiceBySlug,
  getSubServiceLinks,
  getAllSubServiceParams,
} from '@/data/categories';
import { pluralize } from '@/utils/formatters';

// One page per legal service → sub-service. Lawyer data is tag-cached so new
// registrations appear immediately (see lib/lawyers).
export const revalidate = 3600;

export function generateStaticParams() {
  return getAllSubServiceParams();
}

export async function generateMetadata({ params }) {
  const { slug, sub } = await params;
  const service = getServiceBySlug(slug);
  const subService = service && getSubServiceBySlug(service.name, sub);
  if (!service || !subService) {
    return createMetadata({ title: 'Service Not Found', path: '/legal-services' });
  }

  return createMetadata({
    title: `${subService} Lawyers`,
    description: `Find verified lawyers for ${subService} matters (${service.name}) in India. Compare experience and contact them directly.`,
    path: `/legal-services/${service.slug}/${sub}`,
    keywords: [`${subService} lawyer`, `${subService} lawyer`, `${service.name} lawyer`],
  });
}

const TRUST = [
  { icon: ShieldCheck, label: 'Verified lawyers' },
  { icon: MessageSquare, label: 'Contact directly' },
  { icon: BadgeIndianRupee, label: 'Transparent fees' },
];

export default async function SubServicePage({ params }) {
  const { slug, sub } = await params;
  const service = getServiceBySlug(slug);
  const subService = service && getSubServiceBySlug(service.name, sub);
  if (!service || !subService) notFound();

  const Icon = service.icon;

  // Only lawyers who explicitly listed this specific matter. A lawyer who
  // did not add it must NOT appear here — no category-wide fallback.
  const allAdvocates = await getAllAdvocates();
  const advocates = allAdvocates.filter((a) => a.subSpecializations?.includes(subService));

  // Sibling matters under the same category to explore next.
  const siblings = getSubServiceLinks(service.name).filter((s) => s.slug !== sub);

  // Cities to offer a location-specific version of this matter.
  const cities = (await getAllCities()).slice(0, 12);

  return (
    <>
      <JsonLd
        data={[
          serviceSchema({ name: subService, slug: `${service.slug}/${sub}`, description: `${subService} legal matters` }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Legal Services', path: '/legal-services' },
            { name: service.name, path: `/legal-services/${service.slug}` },
            { name: subService, path: `/legal-services/${service.slug}/${sub}` },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={service.name}
        title={`${subService} Lawyers`}
        subtitle={`Verified lawyers who handle ${subService} matters under ${service.name}. Compare experience, fees and contact them directly.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services', href: '/legal-services' },
          { label: service.name, href: `/legal-services/${service.slug}` },
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
                    href={`/legal-services/${service.slug}`}
                    className="text-xs font-semibold uppercase tracking-wider text-accent hover:underline"
                  >
                    {service.name}
                  </Link>
                  <h2 className="font-display text-2xl font-bold text-ink">{subService}</h2>
                </div>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-ink/70">
                Looking for a <span className="font-medium text-ink">{subService}</span> lawyer?
                Legal Care India connects you with verified lawyers who specialise in {subService}{' '}
                matters under {service.name}. Compare their experience, ratings and consultation
                fees, then reach out directly — no middlemen and no commission on your case.
              </p>

              {/* Trust strip */}
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
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">
                At a glance
              </p>
              <dl className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">Lawyers for this matter</dt>
                    <dd className="font-semibold text-ink">{advocates.length}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Scale className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">Practice area</dt>
                    <dd className="font-semibold text-ink">
                      <Link href={`/legal-services/${service.slug}`} className="hover:text-primary">
                        {service.name}
                      </Link>
                    </dd>
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

        {/* ── Lawyers for this matter ─────────────────────────────── */}
        <div className="mt-14">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-semibold text-ink">
              {advocates.length > 0
                ? `${pluralize(advocates.length, 'lawyer')} for ${subService}`
                : `${subService} Lawyers`}
            </h2>
            <Link
              href={`/legal-services/${service.slug}`}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All {service.name}
            </Link>
          </div>

          <div className="mt-5">
            <AdvocateListing
              advocates={advocates}
              showFilters={false}
              emptyTitle={`No ${subService} lawyers yet`}
              emptyMessage={`No lawyer has listed ${subService} as a specific matter yet. Browse all ${service.name} lawyers — many can still help with your ${subService} matter.`}
              emptyAction={
                <Link
                  href={`/legal-services/${service.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
                >
                  Browse all {service.name} lawyers
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              }
            />
          </div>
        </div>

        {/* ── Find this matter by city ──────────────────────────────── */}
        {cities.length > 0 && (
          <SectionReveal>
            <div className="mt-14">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="font-display text-xl font-semibold text-ink">
                  {subService} lawyers by city
                </h2>
              </div>
              <p className="mt-1.5 text-sm text-ink/55">
                Find {subService} lawyers in your city.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {cities.map((c) => (
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

        {/* ── Sibling matters ───────────────────────────────────────── */}
        {siblings.length > 0 && (
          <SectionReveal>
            <div className="mt-14 rounded-3xl border border-ink/8 bg-muted/40 p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-ink">
                Other {service.name} matters
              </h2>
              <p className="mt-1.5 text-sm text-ink/55">
                Explore more specific matters handled under {service.name}.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {siblings.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/legal-services/${service.slug}/${s.slug}`}
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
