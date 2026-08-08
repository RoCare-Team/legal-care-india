import { Mail, Phone, MapPin, Clock, LifeBuoy } from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import ContactForm from '@/components/contact/ContactForm';
import JsonLd from '@/components/shared/JsonLd';
import { FaqList } from '@/components/views/sections/ContentSections';
import { SeoSection, LinkCardGrid } from '@/components/shared/SeoSection';
import { webPageSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { CONTACT, addressText, mapsUrl } from '@/constants/site';

export const metadata = createMetadata({
  title: 'Contact Justiceland | Support & Enquiries',
  description:
    'Contact the Justiceland team for help with an account, a consultation or a lawyer profile — by email, phone or WhatsApp. Office in Gurugram, Haryana.',
  path: '/contact',
  keywords: [
    'contact justiceland',
    'justiceland support',
    'lawyer platform support india',
    'justiceland office gurugram',
  ],
});

/**
 * Who to write to, and about what.
 *
 * Two mailboxes exist for a reason — a résumé and a client who cannot log in
 * should not land in the same queue — so the page says which is which rather
 * than listing both and leaving the visitor to guess.
 */
const ROUTES = [
  {
    href: `mailto:${CONTACT.email}`,
    title: 'Account and consultation help',
    text: 'A consultation that did not connect, a wallet or billing question, a password you cannot reset, or anything that has gone wrong. Write to the support address and a person will pick it up.',
  },
  {
    href: `mailto:${CONTACT.infoEmail}`,
    title: 'Lawyers, partnerships and press',
    text: 'Listing your practice, a question about verification, a partnership, a media enquiry or a job application. These go to the general enquiries address.',
  },
];

/**
 * The same questions and answers rendered on the page below. FAQ schema is
 * only added for FAQs a visitor can actually read.
 */
const FAQS = [
  {
    q: 'How quickly does Justiceland reply?',
    a: 'Support email is read through the working week and most messages are answered the same day or the next. If something is urgent — a consultation in progress, a payment that looks wrong — the phone number and WhatsApp on this page will reach us faster than email.',
  },
  {
    q: 'I am a lawyer. How do I get listed?',
    a: 'Register your practice with your Bar Council enrolment number and fill in the areas you take, the courts you appear in and your per-minute rates. The profile is reviewed before it appears publicly in the directory, and you can edit everything afterwards from your dashboard.',
  },
  {
    q: 'Can Justiceland give me legal advice?',
    a: 'No. Justiceland is a platform for finding and consulting lawyers — it is not a law firm and the team here does not advise on legal matters. For advice on your situation, consult one of the lawyers listed in the directory; they are the ones qualified to give it.',
  },
  {
    q: 'I have a complaint about a lawyer on the platform.',
    a: 'Write to the support address with the lawyer name and what happened, and include the date of the consultation if there was one. Complaints are reviewed individually, and a profile can be unpublished while that is being done.',
  },
];

const INFO = [
  { icon: LifeBuoy, label: 'Support', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: Mail, label: 'General enquiries', value: CONTACT.infoEmail, href: `mailto:${CONTACT.infoEmail}` },
  { icon: Phone, label: 'Phone', value: CONTACT.phone, href: `tel:${CONTACT.phone}` },
  { icon: MapPin, label: 'Office', value: addressText, href: mapsUrl },
  { icon: Clock, label: 'Support Hours', value: 'Mon – Sat, 10 AM – 7 PM' },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            type: 'ContactPage',
            name: 'Contact Justiceland',
            description: 'Get in touch with the Justiceland team for support, partnerships or feedback.',
            path: '/contact',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Contact', path: '/contact' },
          ]),
          faqSchema(FAQS),
        ]}
      />
      <PageHeader
        eyebrow="We're here to help"
        title="Contact Justiceland"
        subtitle="Questions about your profile, verification or the platform? Send us a message and we'll respond quickly."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
      />
      <Container className="py-10 sm:py-12">
        <h2 className="sr-only">Contact details and message form</h2>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            {INFO.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3 rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs text-ink/45">{label}</p>
                  {href ? (
                    <a href={href} className="text-sm font-medium text-ink/85 hover:text-primary">{value}</a>
                  ) : (
                    <p className="text-sm font-medium text-ink/85">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>

        <SeoSection
          title="Which Address to Write To"
          lead="Two mailboxes, so a job application and a client who cannot log in do not end up in the same queue."
        >
          <LinkCardGrid items={ROUTES} />
        </SeoSection>

        <FaqList title="Frequently Asked Questions" faqs={FAQS} />
      </Container>
    </>
  );
}
