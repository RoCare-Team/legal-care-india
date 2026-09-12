import Link from 'next/link';
import { ShieldCheck, IndianRupee, Timer, Scale, ArrowRight } from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import JsonLd from '@/components/shared/JsonLd';
import SectionReveal from '@/components/shared/SectionReveal';
import { FaqList } from '@/components/views/sections/ContentSections';
import { breadcrumbSchema, faqSchema, webPageSchema, abs } from '@/lib/schema';
import { listServices, listServiceCategories } from '@/lib/legalServices';
import ServicesCatalogue from '@/components/services/ServicesCatalogue';

/**
 * /services — the fixed-price legal services catalogue.
 *
 * A different product from the rest of the site, and deliberately its own
 * page. /legal-services is the practice areas — civil, criminal, family — and
 * leads to a lawyer you talk to by the minute. This is work with a known scope
 * and a known price: a company registered, a rent agreement drafted, a
 * trademark filed. The mobile app already sells these through
 * /api/marketplace/services; this is the same catalogue on the web.
 */
export const revalidate = 600;

export const metadata = createMetadata({
  title: 'Legal Services at Fixed Prices',
  description:
    'Company registration, GST, trademark filing, rent agreements, legal notices and more — fixed prices, clear timelines, handled by verified lawyers.',
  path: '/services',
  keywords: [
    'legal services online india',
    'company registration online',
    'gst registration online',
    'trademark registration india',
    'rent agreement online',
    'legal notice drafting',
  ],
});

const WHY = [
  {
    icon: IndianRupee,
    title: 'One fixed price',
    text: 'The price on the card is the price of the work. GST is shown before you pay, and nothing is added afterwards.',
  },
  {
    icon: Timer,
    title: 'A stated timeline',
    text: 'Every service says how long it usually takes, so you can plan around it instead of asking for updates.',
  },
  {
    icon: ShieldCheck,
    title: 'Handled by verified lawyers',
    text: 'The same lawyers listed on this platform do the work — their Bar Council enrolment is checked before they are published.',
  },
];

const FAQS = [
  {
    q: 'How is this different from consulting a lawyer?',
    a: 'A consultation is time with a lawyer, billed by the minute, for advice on your situation. A service here is a piece of work with a fixed scope and a fixed price — a registration, a drafted document, a filing. If you are not sure which you need, start with a consultation.',
  },
  {
    q: 'Is GST included in the price shown?',
    a: 'No. Prices are quoted before tax, and GST at 18% is added at checkout, where you see the base, the tax and the total separately before paying.',
  },
  {
    q: 'What does the price cover?',
    a: 'Every service page lists exactly what is included and the documents you will be asked for. Government fees, stamp duty and any third-party charges are stated separately where they apply.',
  },
  {
    q: 'How long does a service take?',
    a: 'Each service states its usual turnaround — two to three working days for a rent agreement, ten to fifteen for a private limited company. Anything that depends on a court or a government department says so, because that part is not ours to promise.',
  },
  {
    q: 'Who do I talk to once I order?',
    a: 'A lawyer is assigned to the matter and contacts you for the documents. You can also reach the support line on the number in the footer at any point.',
  },
];

export default async function ServicesPage() {
  const [services, categories] = await Promise.all([
    listServices({ limit: 200 }),
    listServiceCategories(),
  ]);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
          ]),
          webPageSchema({
            type: 'CollectionPage',
            name: 'Legal Services at Fixed Prices',
            description:
              'Fixed-price legal services — company registration, GST, trademark, documentation and more.',
            path: '/services',
          }),
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            numberOfItems: services.length,
            itemListElement: services.slice(0, 25).map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: s.title,
              url: abs(`/services/${s.slug}`),
            })),
          },
          faqSchema(FAQS),
        ]}
      />

      <PageHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Services' }]}
        eyebrow={services.length > 0 ? `${services.length} services` : 'Fixed price'}
        title="Legal Services at Fixed Prices"
        subtitle="Registrations, filings and documents at a stated price — done by verified lawyers."
      />

      <Container className="py-8 sm:py-10">
        {services.length > 0 ? (
          <ServicesCatalogue services={services} categories={categories} />
        ) : (
          <div className="grid place-items-center rounded-2xl border border-dashed border-ink/15 bg-muted/40 px-6 py-16 text-center">
            <Scale className="h-10 w-10 text-ink/30" aria-hidden="true" />
            <h2 className="mt-4 font-semibold text-ink">No services listed yet</h2>
            <p className="mt-1 max-w-sm text-sm text-ink/55">
              They are being added. In the meantime you can consult a lawyer directly about your
              matter.
            </p>
            <Link
              href="/lawyers"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-colors hover:bg-primary-dark"
            >
              Find a lawyer
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        <SectionReveal>
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold text-ink">Why a fixed price works</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {WHY.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/[0.07] text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 font-display text-base font-bold text-ink">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{text}</p>
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section className="mt-14 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-light via-primary to-primary-dark p-6 text-white shadow-brand sm:p-8">
            <h2 className="font-display text-xl font-semibold sm:text-2xl">
              Not sure which service you need?
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/70">
              Talk to a lawyer first — by chat, call or video, charged for the minutes you use. They
              will tell you whether your matter needs one of these services or something else
              entirely.
            </p>
            <Link
              href="/lawyers"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#E7C766] via-accent to-[#BC9A2E] px-5 py-3 text-sm font-bold text-[#241B02] shadow-gold"
            >
              Find a lawyer
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        </SectionReveal>

        <FaqList title="Frequently Asked Questions" faqs={FAQS} />
      </Container>
    </>
  );
}
