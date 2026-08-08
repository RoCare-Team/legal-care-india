import Link from 'next/link';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import CategoryCard from '@/components/cards/CategoryCard';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import { FaqList } from '@/components/views/sections/ContentSections';
import { breadcrumbSchema, faqSchema, webPageSchema } from '@/lib/schema';
import { CATEGORIES } from '@/data/categories';

export const metadata = createMetadata({
  title: 'Legal Services in India | Find a Lawyer',
  description:
    'Browse every legal service on Justiceland — civil, criminal, family, property, corporate, tax and more — and find a verified lawyer for your matter.',
  path: '/legal-services',
  keywords: [
    'legal services india',
    'types of lawyers in india',
    'find a lawyer by practice area',
    'legal advice online india',
    'consult a lawyer india',
  ],
});

/**
 * Which service a problem belongs to.
 *
 * Most people arrive knowing their problem, not its legal category — "my
 * builder hasn't handed over the flat" rather than "I need a RERA lawyer".
 * This maps the one to the other, and every row is a link into the practice
 * area that handles it, so the page is a route into the site rather than a
 * dead end with a grid on it.
 *
 * Slugs are the real ones from `data/categories.js`; nothing here invents a
 * page that does not exist.
 */
const PROBLEM_MAP = [
  {
    slug: 'property-lawyer',
    label: 'Property Law',
    problem: 'A sale deed to check, a title dispute, a builder who has not handed over possession, or an inherited property to divide.',
  },
  {
    slug: 'family-lawyer',
    label: 'Family Law',
    problem: 'Divorce, maintenance, child custody, a domestic violence complaint, or a will and succession matter.',
  },
  {
    slug: 'criminal-lawyer',
    label: 'Criminal Law',
    problem: 'An FIR filed against you or someone in your family, a bail application, a cheque bounce case, or a police summons.',
  },
  {
    slug: 'civil-lawyer',
    label: 'Civil Law',
    problem: 'Money recovery, a breach of contract, a landlord or tenant dispute, or an injunction to stop something happening.',
  },
  {
    slug: 'corporate-lawyer',
    label: 'Corporate Law',
    problem: 'Company incorporation, shareholder agreements, contracts to draft or review, or a commercial dispute.',
  },
  {
    slug: 'labour-lawyer',
    label: 'Labour & Employment',
    problem: 'Wrongful termination, unpaid salary or dues, a workplace harassment complaint, or an employment contract to review.',
  },
  {
    slug: 'consumer-lawyer',
    label: 'Consumer Law',
    problem: 'A defective product, a service you paid for and did not get, insurance repudiation, or a builder delay claim.',
  },
  {
    slug: 'tax-lawyer',
    label: 'Tax Law',
    problem: 'An income tax or GST notice, an assessment you want to appeal, or a demand you believe is wrong.',
  },
];

/**
 * Answers to what people actually ask before their first consultation. These
 * are the same questions and answers rendered on the page below — the FAQ
 * schema describes what is visible, never more.
 */
const FAQS = [
  {
    q: 'Which type of lawyer do I need for my case?',
    a: 'Start from the problem rather than the category. A cheque that bounced is a criminal matter; an unpaid invoice is a civil one; a flat that was never handed over is usually property or consumer, sometimes both. The list above maps common situations to the practice area that handles them, and every lawyer profile states the areas they take. If you are unsure, a short consultation is the cheapest way to find out — a lawyer will tell you in a few minutes whether your matter is theirs.',
  },
  {
    q: 'How much does it cost to consult a lawyer on Justiceland?',
    a: 'Every lawyer sets their own per-minute rate for chat, audio and video, and it is shown on their profile and on every listing card before you start. You are charged only for the minutes a consultation actually runs, settled from your wallet when it ends — so a three-minute answer costs three minutes. There is no platform fee on top and no package to buy in advance.',
  },
  {
    q: 'Are the lawyers on Justiceland verified?',
    a: 'Every lawyer registers with their Bar Council enrolment number, and a profile is reviewed before it appears publicly in the directory. What a profile shows — practice areas, courts, languages, experience, fees — is what that lawyer has entered about their own practice. Anything they have not supplied is left blank rather than filled in for them.',
  },
  {
    q: 'Can I speak to a lawyer without revealing my identity?',
    a: 'Yes. You can turn on anonymous mode in your account, and the lawyer sees your consultation as coming from "Anonymous" instead of your name. What you choose to tell them during the consultation is up to you, and anything you do say is covered by the confidentiality a lawyer owes a client.',
  },
  {
    q: 'Do I have to travel to the lawyer’s office?',
    a: 'Not for the first conversation. Consultations happen on Justiceland by live chat, audio call or video call, so you can describe the matter and get a view on it from wherever you are. If the matter needs filing, representation or documents signed, you and the lawyer can take it from there — every profile also lists the office address and the courts they appear in.',
  },
  {
    q: 'What should I keep ready before the consultation?',
    a: 'A short written summary of what happened and when, and any paperwork that names dates, amounts or parties — an agreement, a notice, an FIR copy, a receipt, a bank statement. Lawyers charge by the minute here, so ten minutes spent arranging your facts beforehand is usually the cheapest ten minutes of the whole matter.',
  },
];

export default function LegalServicesPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Legal Services', path: '/legal-services' },
          ]),
          webPageSchema({
            name: 'Legal Services in India',
            description:
              'Every legal service on Justiceland, and the kind of matter each one handles.',
            path: '/legal-services',
          }),
          faqSchema(FAQS),
        ]}
      />

      <PageHeader
        eyebrow="Browse by Legal Service"
        title="Legal Services in India"
        subtitle="Pick the area your matter belongs to and find lawyers who practise in exactly that — across every city in India."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Legal Services' }]}
      />

      <Container className="py-10 sm:py-12">
        <SectionReveal>
          <section>
            <h2 className="font-display text-2xl font-bold text-ink">
              Browse Legal Services
            </h2>
            <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink/60">
              Indian law is wide, and the lawyer who is right for a property title is
              rarely the one you want for a bail application. Each area below leads to
              the lawyers who take that work, what a case in it usually involves, and
              the questions people ask before they start.
            </p>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {CATEGORIES.map((category, i) => (
                <SectionReveal key={category.slug} delay={i * 0.04}>
                  <CategoryCard category={category} />
                </SectionReveal>
              ))}
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-ink">
              Not Sure Which Lawyer You Need?
            </h2>
            <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink/60">
              Most people arrive with a situation, not a category. Find the line that
              sounds closest to yours — it leads to the lawyers who handle it.
            </p>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {PROBLEM_MAP.map(({ slug, label, problem }) => (
                <li key={slug}>
                  <Link
                    href={`/${slug}`}
                    className="group block h-full rounded-2xl border border-ink/8 bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover"
                  >
                    <h3 className="font-display text-base font-bold text-ink transition-colors group-hover:text-primary">
                      {label}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{problem}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-ink">
              How Consultations Work on Justiceland
            </h2>

            <div className="mt-7 grid gap-5 sm:grid-cols-3">
              <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
                <h3 className="font-display text-base font-bold text-ink">
                  1. Find the right lawyer
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">
                  Filter the directory by practice area, city, court and language, or
                  search by name. Every card shows experience, the areas that lawyer
                  takes and their per-minute rate, so you can compare before you commit
                  to anything.
                </p>
              </div>
              <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
                <h3 className="font-display text-base font-bold text-ink">
                  2. Start a consultation
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">
                  Chat, audio call or video call — whichever suits the matter. Nothing
                  is charged while you wait for the lawyer to accept, and the clock only
                  starts once you are connected.
                </p>
              </div>
              <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
                <h3 className="font-display text-base font-bold text-ink">
                  3. Pay for the minutes you used
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">
                  The cost is counted as you talk and settled from your wallet when the
                  consultation ends. End it whenever your question is answered — there
                  is no minimum package and nothing to cancel.
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-ink/60">
              You can browse the{' '}
              <Link href="/lawyers" className="font-medium text-primary hover:underline">
                full lawyer directory
              </Link>
              , narrow it to{' '}
              <Link href="/cities" className="font-medium text-primary hover:underline">
                lawyers in your city
              </Link>
              , or read our{' '}
              <Link href="/blogs" className="font-medium text-primary hover:underline">
                legal guides
              </Link>{' '}
              first if you would rather understand the ground before speaking to anyone.
            </p>
          </section>
        </SectionReveal>

        <FaqList title="Frequently Asked Questions" faqs={FAQS} />
      </Container>
    </>
  );
}
