import Link from 'next/link';
import { ShieldCheck, MessageSquare, BadgeIndianRupee, Users, Layers } from 'lucide-react';
import { Container, Card } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import MatterGrid from '@/components/views/sections/MatterGrid';
import LawyerSidebar from '@/components/views/sections/LawyerSidebar';
import FactStrip from '@/components/views/sections/FactStrip';
import {
  WhenToConsult, WhatLawyerDoes, ProcessSteps, FaqList,
} from '@/components/views/sections/ContentSections';
import { serviceSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { getAllAdvocates } from '@/lib/advocates';
import { servicePath, matterPath } from '@/lib/serviceRoutes';
import { getSubServiceLinks, CATEGORIES } from '@/data/categories';
import { getServiceContent } from '@/data/serviceContent';
import { pluralize } from '@/utils/formatters';

/** `/[service]` — one practice area across all of India. */

const TRUST = [
  { icon: ShieldCheck, label: 'Verified lawyers' },
  { icon: MessageSquare, label: 'Contact directly' },
  { icon: BadgeIndianRupee, label: 'Transparent fees' },
];

/** Questions every practice area shares, appended after its own. */
function genericFaqs(service) {
  return [
    {
      q: `How much does a ${service.name} consultation cost?`,
      a: 'Fees vary by the lawyer and the complexity of your matter. Each lawyer lists their consultation fee on their profile, so you can pick one that suits your budget before reaching out.',
    },
    {
      q: 'Is contacting a lawyer on Legal Care India free?',
      a: 'Yes. Browsing profiles and contacting lawyers is completely free. You only pay the lawyer directly for their consultation or case work.',
    },
  ];
}

export function serviceMeta(service) {
  const content = getServiceContent(service.name);
  return {
    title: `${service.name} Lawyers`,
    description: content
      ? `${content.intro[0].slice(0, 150)}…`
      : `Find verified ${service.name} lawyers in India. ${service.description}`,
    path: servicePath(service),
    keywords: [`${service.name} lawyer`, `best ${service.name} lawyer in India`],
  };
}

export default async function ServiceView({ service }) {
  const Icon = service.icon;
  const matters = getSubServiceLinks(service.name);
  const content = getServiceContent(service.name);

  // Honest counts, straight from registered profiles — no marketing figures.
  const allAdvocates = await getAllAdvocates();
  const advocates = allAdvocates.filter((a) => a.specializations?.includes(service.name));
  const countFor = (matter) =>
    allAdvocates.filter((a) => a.subSpecializations?.includes(matter.name)).length;

  const faqs = [...(content?.faqs || []), ...genericFaqs(service)];
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
            { name: service.name, path: servicePath(service) },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={advocates.length > 0 ? `${pluralize(advocates.length, 'lawyer')} available` : 'Practice Area'}
        title={`${service.name} Lawyers`}
        subtitle={service.description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services', href: '/legal-services' },
          { label: service.name },
        ]}
      />

      <Container className="py-10 sm:py-14">
        {/* Content on the left; the lawyer rail pinned alongside it. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
          {/* The lawyer rail leads on a narrow screen. Stacked in source order
              it landed below every word of the page, so the one thing the
              visitor came for was the last thing they could reach. */}
          <div className="order-2 min-w-0 lg:order-1">
            <SectionReveal>
              <section>
                <div className="flex items-center gap-3.5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white ring-1 ring-primary/20">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                      Practice Area
                    </p>
                    <h2 className="font-display text-2xl font-bold text-ink">{service.name}</h2>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {(content?.intro || [service.overview || service.description]).map((para) => (
                    <p key={para.slice(0, 40)} className="text-[15px] leading-[1.75] text-ink/70">
                      {para}
                    </p>
                  ))}
                </div>

                <div className="mt-7 flex flex-wrap gap-2.5">
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

                <FactStrip
                  facts={[
                    { icon: Users, label: 'Lawyers available', value: advocates.length },
                    { icon: Layers, label: 'Matters covered', value: matters.length },
                    { icon: ShieldCheck, label: 'Verified profiles', value: 'Free to contact', tone: 'positive' },
                  ]}
                />
              </section>
            </SectionReveal>

            <MatterGrid
              title={`Matters we cover under ${service.name}`}
              subtitle="Tap a matter to see the lawyers who handle exactly that, not just the broad area."
              matters={matters}
              hrefFor={(m) => matterPath(m.slug)}
              countFor={countFor}
            />

            <WhenToConsult
              title={`When you need a ${service.name} lawyer`}
              items={content?.whenToConsult}
            />

            <WhatLawyerDoes
              title={`What a ${service.name} lawyer does for you`}
              does={content?.whatLawyerDoes}
              documents={content?.documents}
            />

            <ProcessSteps title="How the matter proceeds" steps={content?.process} />

            <FaqList title={`${service.name} — frequently asked questions`} faqs={faqs} />

            {/* ── Other practice areas ──────────────────────────────── */}
            <SectionReveal>
              <section className="mt-16">
                <h2 className="mb-6 font-display text-2xl font-bold text-ink">
                  Explore other practice areas
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {related.map((c) => {
                    const RelIcon = c.icon;
                    return (
                      <Card
                        key={c.slug}
                        as={Link}
                        href={servicePath(c)}
                        hoverable
                        padding="none"
                        className="group flex flex-col items-center gap-2 p-4 text-center transition-all duration-300 hover:-translate-y-1"
                      >
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/5 text-primary ring-1 ring-primary/10 transition-colors group-hover:bg-primary group-hover:text-white">
                          <RelIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="text-xs font-medium leading-tight text-ink/80">
                          {c.name}
                        </span>
                      </Card>
                    );
                  })}
                </div>
              </section>
            </SectionReveal>
          </div>

          <LawyerSidebar
            className="order-1 lg:order-2"
            advocates={advocates}
            label={`${service.name} matters`}
            allHref={`/lawyers?service=${service.slug}`}
            emptyMessage={`No verified ${service.name} lawyer has registered yet. New profiles appear here as they join.`}
          />
        </div>
      </Container>
    </>
  );
}
