import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight, ChevronDown, ShieldCheck, MessageSquare, BadgeIndianRupee,
  Users, Layers, Sparkles,
} from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container, Card } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import AdvocateListing from '@/components/listing/AdvocateListing';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import { serviceSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { getAllAdvocates } from '@/lib/advocates';
import { getServiceBySlug, getSubServiceLinks, CATEGORIES } from '@/data/categories';
import { pluralize } from '@/utils/formatters';

// Prerender one page per legal service; lawyer data is tag-cached so new
// registrations appear immediately (see lib/lawyers).
export const revalidate = 3600;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return createMetadata({ title: 'Service Not Found', path: '/legal-services' });

  return createMetadata({
    title: `${service.name} Lawyers`,
    description: `Find verified ${service.name} lawyers in India. ${service.description} Compare experience and contact them directly.`,
    path: `/legal-services/${service.slug}`,
    keywords: [`${service.name} lawyer`, `${service.name} lawyer`],
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

/** Category-specific FAQs, generated from the service name + its matters. */
function buildFaqs(service, subNames) {
  const examples = subNames.slice(0, 5).join(', ');
  return [
    {
      q: `How do I find a good ${service.name} lawyer?`,
      a: `Browse verified ${service.name} lawyers on Legal Care India, compare their experience, ratings and consultation fees, and contact the right one directly. Every profile is registered and verified.`,
    },
    {
      q: `What matters does a ${service.name} lawyer handle?`,
      a: `${service.name} lawyers handle matters such as ${examples}${subNames.length > 5 ? ' and more' : ''} — ${service.description.toLowerCase()}`,
    },
    {
      q: `How much does a ${service.name} consultation cost?`,
      a: `Fees vary by the lawyer and the complexity of your matter. Each lawyer lists their consultation fee on their profile, so you can pick one that suits your budget before reaching out.`,
    },
    {
      q: 'Is contacting a lawyer on Legal Care India free?',
      a: 'Yes. Browsing profiles and contacting lawyers is completely free. You only pay the lawyer directly for their consultation or case work.',
    },
  ];
}

export default async function LegalServicePage({ params }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const Icon = service.icon;
  const subServices = getSubServiceLinks(service.name);
  const faqs = buildFaqs(service, subServices.map((s) => s.name));

  // Real lawyers practising this service (broad category stored in
  // `specializations` at registration). Count is honest — no marketing figure.
  const allAdvocates = await getAllAdvocates();
  const inService = allAdvocates.filter((a) => a.specializations?.includes(service.name));
  const count = inService.length;

  // A few other services to explore next.
  const related = CATEGORIES.filter((c) => c.slug !== service.slug).slice(0, 6);

  return (
    <>
      <JsonLd
        data={[
          serviceSchema(service),
          faqSchema(faqs),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Legal Services', path: '/legal-services' },
            { name: service.name, path: `/legal-services/${service.slug}` },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={count > 0 ? `${pluralize(count, 'lawyer')} available` : 'Legal Service'}
        title={`${service.name} Lawyers`}
        subtitle={service.description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services', href: '/legal-services' },
          { label: service.name },
        ]}
      />

      <Container className="py-10 sm:py-14">
        {/* ── Intro: overview + quick facts ─────────────────────────── */}
        <SectionReveal>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white ring-1 ring-primary/20">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Legal Service
                  </p>
                  <h2 className="font-display text-2xl font-bold text-ink">{service.name}</h2>
                </div>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-ink/70">
                {service.overview || service.description}
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
                    <Layers className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">Matters covered</dt>
                    <dd className="font-semibold text-ink">{subServices.length}</dd>
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

        {/* ── What this covers: clickable matters ───────────────────── */}
        {subServices.length > 0 && (
          <SectionReveal>
            <div className="mt-14">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="font-display text-xl font-semibold text-ink">
                  Matters we cover under {service.name}
                </h2>
              </div>
              <p className="mt-1.5 text-sm text-ink/55">
                Tap a matter to see lawyers who specialise in exactly that.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subServices.map((item) => (
                  <Card
                    key={item.slug}
                    as={Link}
                    href={`/legal-services/${service.slug}/${item.slug}`}
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

        {/* ── Why choose Legal Care India ───────────────────────────── */}
        <SectionReveal>
          <div className="mt-14 rounded-3xl border border-ink/8 bg-muted/40 p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-ink">
              Why find your {service.name} lawyer here
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

        {/* ── Lawyers in this category ────────────────────────────── */}
        <div className="mt-14">
          <h2 className="mb-5 font-display text-xl font-semibold text-ink">
            {service.name} Lawyers
          </h2>
          <AdvocateListing advocates={allAdvocates} initial={{ service: service.name }} />
        </div>

        {/* ── FAQs ──────────────────────────────────────────────────── */}
        <SectionReveal>
          <div className="mt-14">
            <h2 className="mb-5 font-display text-xl font-semibold text-ink">
              {service.name} — Frequently asked questions
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

        {/* ── Explore other legal services ──────────────────────────── */}
        <SectionReveal>
          <div className="mt-14">
            <h2 className="mb-5 font-display text-xl font-semibold text-ink">
              Explore other legal services
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {related.map((c) => {
                const RelIcon = c.icon;
                return (
                  <Card
                    key={c.slug}
                    as={Link}
                    href={`/legal-services/${c.slug}`}
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
