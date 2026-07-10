import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import ContactForm from '@/components/contact/ContactForm';
import JsonLd from '@/components/shared/JsonLd';
import { webPageSchema, breadcrumbSchema } from '@/lib/schema';
import { CONTACT } from '@/constants/site';

export const metadata = createMetadata({
  title: 'Contact Us',
  description: 'Get in touch with the Legal Care India team for support, partnerships or feedback.',
  path: '/contact',
});

const INFO = [
  { icon: Mail, label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: Phone, label: 'Phone', value: CONTACT.phone, href: `tel:${CONTACT.phone}` },
  { icon: MapPin, label: 'Location', value: 'India' },
  { icon: Clock, label: 'Support Hours', value: 'Mon – Sat, 10 AM – 7 PM' },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            type: 'ContactPage',
            name: 'Contact Legal Care India',
            description: 'Get in touch with the Legal Care India team for support, partnerships or feedback.',
            path: '/contact',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Contact', path: '/contact' },
          ]),
        ]}
      />
      <PageHeader
        eyebrow="We're here to help"
        title="Contact Legal Care India"
        subtitle="Questions about your profile, verification or the platform? Send us a message and we'll respond quickly."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
      />
      <Container className="py-10 sm:py-12">
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
      </Container>
    </>
  );
}
