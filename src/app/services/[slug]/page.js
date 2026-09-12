import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Check, FileText, Clock, ShieldCheck, Phone, ArrowRight, IndianRupee,
} from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import JsonLd from '@/components/shared/JsonLd';
import ServiceCard from '@/components/services/ServiceCard';
import ServiceCheckout from '@/components/services/ServiceCheckout';
import { breadcrumbSchema, abs } from '@/lib/schema';
import { getServiceBySlug, listServices } from '@/lib/legalServices';
import { GST_RATE, gstOn } from '@/constants/tax';
import { CONTACT, SITE } from '@/constants/site';

/**
 * /services/[slug] — one fixed-price service.
 *
 * Everything a client needs before committing: what the work is, what it
 * costs with tax, what they get, what they will be asked for, and what
 * happens in what order. The figures come from the database through
 * `getServiceBySlug`, never from the URL — the same rule the order route
 * follows, so a page and an invoice cannot disagree about a price.
 *
 * Paying happens in ServiceCheckout, through the same order and verify
 * endpoints the mobile app uses, so a price change or a coupon rule lands on
 * both at once.
 */
export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return createMetadata({ title: 'Service Not Found', path: '/services' });

  return createMetadata({
    title: `${service.title} — ₹${service.price.toLocaleString('en-IN')}`,
    description:
      service.summary ||
      `${service.title} at a fixed price of ₹${service.price.toLocaleString('en-IN')} plus GST, handled by verified lawyers on Justiceland.`,
    path: `/services/${service.slug}`,
    keywords: [service.title, service.category, 'fixed price legal service'].filter(Boolean),
  });
}

/** A titled block in the left column. Rendered only when it has content. */
function Block({ id, title, icon: Icon, children }) {
  return (
    <section id={id} className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-7">
      <h2 className="mb-4 flex items-center gap-3 border-b border-ink/[0.06] pb-4 font-display text-[19px] font-semibold text-ink sm:text-[21px]">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/[0.07] text-primary">
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ServiceDetailPage({ params }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  const {
    title, category, summary, description, price, mrp, discountPercent, turnaround,
    includes = [], documentsRequired = [], howItWorks = [],
  } = service;

  const tax = gstOn(price);
  const total = price + tax;

  // Same category, minus this one — what somebody comparing options looks for.
  const related = (await listServices({ category, limit: 5 }))
    .filter((s) => s.slug !== service.slug)
    .slice(0, 3);

  const waText = encodeURIComponent(
    `Hi, I would like to order the "${title}" service (₹${price.toLocaleString('en-IN')} + GST) on Justiceland.`
  );

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
            { name: title, path: `/services/${service.slug}` },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: title,
            serviceType: category || 'Legal service',
            description: description || summary,
            url: abs(`/services/${service.slug}`),
            provider: { '@id': `${SITE.url}/#organization` },
            areaServed: { '@type': 'Country', name: 'India' },
            offers: {
              '@type': 'Offer',
              price,
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: abs(`/services/${service.slug}`),
            },
          },
        ]}
      />

      <PageHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: title },
        ]}
        eyebrow={category}
        title={title}
        subtitle={summary}
      />

      <Container className="grid gap-5 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:items-start">
        <div className="min-w-0 space-y-5">
          {description && (
            <Block id="about" title="About this service" icon={FileText}>
              <p className="whitespace-pre-line text-[14.5px] leading-[1.75] text-ink/70 sm:text-[15.5px]">
                {description}
              </p>
            </Block>
          )}

          {includes.length > 0 && (
            <Block id="includes" title="What you get" icon={Check}>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {includes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 rounded-xl border border-ink/8 bg-[#F8FAFC] px-3.5 py-3 text-[14px] text-ink/75"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {howItWorks.length > 0 && (
            <Block id="how-it-works" title="How it works" icon={ArrowRight}>
              <ol className="space-y-5">
                {howItWorks.map((step, i) => (
                  <li key={`${step.title}-${i}`} className="flex gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary font-display text-[13px] font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="font-semibold text-ink">{step.title}</p>
                      {step.description && (
                        <p className="mt-1 text-[14px] leading-relaxed text-ink/60">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </Block>
          )}

          {documentsRequired.length > 0 && (
            <Block id="documents" title="Documents you will need" icon={FileText}>
              <ul className="space-y-2">
                {documentsRequired.map((doc) => (
                  <li key={doc} className="flex items-start gap-2.5 text-[14px] text-ink/70">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
                    {doc}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-xl bg-[#F4F7FB] px-3.5 py-3 text-[13px] leading-relaxed text-ink/55">
                Scans or clear photographs are fine. The lawyer handling your matter will tell you
                if anything else is needed once they have seen your papers.
              </p>
            </Block>
          )}
        </div>

        {/* Price and the way in. Sticky on a wide screen, because it is the
            thing a reader keeps coming back to as they read the scope. */}
        <aside className="space-y-5 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-ink/8 bg-white p-5 shadow-[0_1px_2px_rgba(30,58,95,0.05),0_18px_40px_-24px_rgba(30,58,95,0.35)]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-[30px] font-bold leading-none text-ink">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  {mrp > 0 && (
                    <span className="text-[15px] text-ink/40 line-through">
                      ₹{mrp.toLocaleString('en-IN')}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[12.5px] text-ink/50">
                  + GST {Math.round(GST_RATE * 100)}% (₹{tax.toLocaleString('en-IN')})
                </p>
              </div>
              {discountPercent > 0 && (
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11.5px] font-bold text-amber-700">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            <p className="mt-3 flex items-center justify-between rounded-xl bg-[#F4F7FB] px-3.5 py-2.5 text-[13.5px]">
              <span className="text-ink/55">Total payable</span>
              <span className="font-display text-[16px] font-bold text-primary">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </p>

            {turnaround && (
              <p className="mt-3 flex items-start gap-2 text-[13px] text-ink/60">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  Usually takes <span className="font-semibold text-ink/80">{turnaround}</span>
                </span>
              </p>
            )}

            <div className="mt-4 space-y-2">
              <ServiceCheckout
                service={{ slug: service.slug, title, price, category }}
                waHref={`https://wa.me/${CONTACT.whatsapp}?text=${waText}`}
              />
              <a
                href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-ink/12 bg-surface text-[14px] font-semibold text-ink transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call {CONTACT.phone}
              </a>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 border-t border-ink/[0.06] pt-3 text-[11.5px] text-ink/50">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
              Fixed price · No hidden charges
            </p>
          </div>

          <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
            <h3 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
              <IndianRupee className="h-4 w-4 text-primary" aria-hidden="true" />
              Government fees
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/60">
              Stamp duty, registration charges and any government or third-party fee are separate
              from this price, and are told to you before they are paid — never added afterwards.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/8 bg-muted/40 p-5">
            <h3 className="text-[14px] font-semibold text-ink">Need advice first?</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink/60">
              Consult a lawyer by chat, call or video and pay only for the minutes you use.
            </p>
            <Link
              href="/lawyers"
              className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary hover:underline"
            >
              Find a lawyer
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-ink/8 bg-muted/30 py-10 sm:py-12">
          <Container>
            <div className="flex items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-bold text-ink">
                Other {category ? category.toLowerCase() : ''} services
              </h2>
              <Link
                href="/services"
                className="shrink-0 text-sm font-semibold text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {related.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
