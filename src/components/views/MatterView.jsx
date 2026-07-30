import Link from 'next/link';
import { ShieldCheck, MessageSquare, BadgeIndianRupee, Users, Scale } from 'lucide-react';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import CitySlider from '@/components/views/sections/CitySlider';
import MatterGrid from '@/components/views/sections/MatterGrid';
import LawyerSidebar from '@/components/views/sections/LawyerSidebar';
import FactStrip from '@/components/views/sections/FactStrip';
import { WhatLawyerDoes, ProcessSteps, FaqList } from '@/components/views/sections/ContentSections';
import { serviceSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { getAllAdvocates } from '@/lib/advocates';
import { getAllCities } from '@/lib/cities';
import { servicePath, matterPath, cityMatterPath } from '@/lib/serviceRoutes';
import { getSubServiceLinks } from '@/data/categories';
import { getServiceContent } from '@/data/serviceContent';
import { getMatterDescription } from '@/data/matterContent';

/** `/[matter]-lawyer` — one specific matter, across all of India. */

const TRUST = [
  { icon: ShieldCheck, label: 'Verified lawyers' },
  { icon: MessageSquare, label: 'Contact directly' },
  { icon: BadgeIndianRupee, label: 'Transparent fees' },
];

export function matterMeta(service, subService, subSlug) {
  const description = getMatterDescription(service.name, subService);
  return {
    title: `${subService} Lawyers`,
    description: description
      ? `${description} Find verified ${subService} lawyers in India — compare experience, fees and contact them directly.`
      : `Find verified lawyers for ${subService} matters (${service.name}) in India.`,
    path: matterPath(subSlug),
    keywords: [`${subService} lawyer`, `${subService} advocate`, `${service.name} lawyer`],
  };
}

export default async function MatterView({ service, subService, subSlug }) {
  const Icon = service.icon;
  const description = getMatterDescription(service.name, subService);
  const content = getServiceContent(service.name);

  // Only lawyers who explicitly listed this matter. A lawyer who did not add it
  // must NOT appear here — no category-wide fallback.
  const allAdvocates = await getAllAdvocates();
  const advocates = allAdvocates.filter((a) => a.subSpecializations?.includes(subService));

  const siblings = getSubServiceLinks(service.name).filter((s) => s.slug !== subSlug);
  const faqs = content?.faqs || [];

  // City tiles for the slider. The href and the count are resolved here because
  // the slider is a client component — functions cannot cross that boundary.
  // Only the four fields it renders are passed; spreading the whole city would
  // ship a landmark image URL per city into the payload for nothing.
  const cities = await getAllCities();
  const cityCards = cities.map((c) => ({
    slug: c.slug,
    name: c.name,
    state: c.state,
    href: cityMatterPath(subSlug, c),
    count: advocates.filter((a) => a.city === c.name).length,
  }));

  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            name: subService,
            slug: `${subSlug}-lawyer`,
            description: description || `${subService} legal matters`,
          }),
          faqSchema(faqs),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Legal Services', path: '/legal-services' },
            { name: service.name, path: servicePath(service) },
            { name: subService, path: matterPath(subSlug) },
          ]),
        ]}
      />
      <PageHeader
        eyebrow={service.name}
        title={`${subService} Lawyers`}
        subtitle={description || `Verified lawyers who handle ${subService} matters under ${service.name}.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services', href: '/legal-services' },
          { label: service.name, href: servicePath(service) },
          { label: subService },
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
                    <Link
                      href={servicePath(service)}
                      className="text-xs font-semibold uppercase tracking-wider text-accent hover:underline"
                    >
                      {service.name}
                    </Link>
                    <h2 className="font-display text-2xl font-bold text-ink">{subService}</h2>
                  </div>
                </div>

                <div className="mt-6 space-y-4 text-[15px] leading-[1.75] text-ink/70">
                  <p>
                    Looking for a <span className="font-medium text-ink">{subService}</span> lawyer?{' '}
                    {description} Legal Care India connects you with verified lawyers who have
                    listed {subService} as a matter they actually handle — not merely{' '}
                    {service.name} in general. Compare their experience, ratings and consultation
                    fees, then reach out directly. No middlemen, and no commission on your case.
                  </p>
                  {content?.intro?.[1] && <p>{content.intro[1]}</p>}
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
                    { icon: Users, label: 'Lawyers for this matter', value: advocates.length },
                    {
                      icon: Scale,
                      label: 'Practice area',
                      value: service.name,
                      href: servicePath(service),
                    },
                    { icon: ShieldCheck, label: 'Verified profiles', value: 'Free to contact', tone: 'positive' },
                  ]}
                />
              </section>
            </SectionReveal>

            {/* Cities sit high up: picking a city is the commonest next step
                from a matter page, so it should not be buried under the guide. */}
            {cityCards.length > 0 && (
              <SectionReveal>
                <section className="mt-16" aria-label={`${subService} lawyers by city`}>
                  <p className="text-sm text-ink/55">Find {subService} lawyers near you.</p>
                  <CitySlider items={cityCards} subject={subService} />
                </section>
              </SectionReveal>
            )}

            <WhatLawyerDoes
              title={`What a ${service.name} lawyer does for you`}
              does={content?.whatLawyerDoes}
              documents={content?.documents}
            />

            <ProcessSteps title="How the matter proceeds" steps={content?.process} />

            <MatterGrid
              title={`Other ${service.name} matters`}
              subtitle={`More specific matters handled under ${service.name}.`}
              matters={siblings}
              hrefFor={(m) => matterPath(m.slug)}
              countFor={(m) =>
                allAdvocates.filter((a) => a.subSpecializations?.includes(m.name)).length
              }
            />

            <FaqList title={`${service.name} — frequently asked questions`} faqs={faqs} />
          </div>

          <LawyerSidebar
            className="order-1 lg:order-2"
            advocates={advocates}
            label={subService}
            allHref={`/lawyers?service=${service.slug}&sub=${subSlug}`}
            emptyMessage={`No lawyer has listed ${subService} as a specific matter yet. Many ${service.name} lawyers can still help.`}
          />
        </div>
      </Container>
    </>
  );
}
