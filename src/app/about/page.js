import { ShieldCheck, Search, HeartHandshake, Scale } from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container, Section, Heading, Button } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import JsonLd from '@/components/shared/JsonLd';
import { webPageSchema, breadcrumbSchema } from '@/lib/schema';
import { PLATFORM_STATS } from '@/data/stats';
import { formatCompactNumber } from '@/utils/formatters';

export const metadata = createMetadata({
  title: 'About Us',
  description:
    'Legal Care India is a premium lawyer discovery platform helping clients find verified lawyers and helping lawyers grow their practice.',
  path: '/about',
});

const VALUES = [
  { icon: ShieldCheck, title: 'Verified & Trusted', text: 'Every lawyer is verified against Bar Council details before their profile goes live.' },
  { icon: Search, title: 'Easy Discovery', text: 'Find the right lawyer by legal service, city, language and experience in seconds.' },
  { icon: HeartHandshake, title: 'Direct Connection', text: 'Clients contact lawyers directly — no commissions, no middlemen, no barriers.' },
  { icon: Scale, title: 'Fair for Lawyers', text: 'A premium public profile that helps lawyers reach clients who genuinely need them.' },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            type: 'AboutPage',
            name: 'About Legal Care India',
            description: 'Legal Care India is a premium lawyer discovery platform helping clients find verified lawyers.',
            path: '/about',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
        ]}
      />
      <PageHeader
        eyebrow="About Legal Care India"
        title="Connecting India with trusted lawyers"
        subtitle="We're building the most trusted way to discover verified lawyers and to help lawyers grow their practice — transparently and directly."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
      />

      <Section spacing="default">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORM_STATS.map((s) => (
            <div key={s.id} className="rounded-2xl border border-ink/8 bg-surface p-6 text-center shadow-card">
              <p className="font-display text-3xl font-semibold text-primary">
                {formatCompactNumber(s.value)}{s.suffix}
              </p>
              <p className="mt-1 text-sm text-ink/55">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section spacing="sm" className="bg-muted/40">
        <Heading eyebrow="Our Mission" subtitle="Legal help in India should be easy to find, transparent and trustworthy. We remove the guesswork — so clients reach the right lawyer faster, and lawyers are discovered by the clients who need them.">
          Making legal help accessible to every Indian
        </Heading>
      </Section>

      <Section spacing="default">
        <Heading centered eyebrow="What we stand for">Our Values</Heading>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm text-ink/60">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Container className="pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-secondary to-primary px-6 py-12 text-center sm:px-12">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Are you a lawyer?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-white/80">
            Create your verified profile and start receiving direct client enquiries today.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/register" variant="accent" size="lg">Register as Lawyer</Button>
            <Button href="/lawyers" size="lg" className="bg-white/10 text-white hover:bg-white/20">
              Find Lawyers
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
