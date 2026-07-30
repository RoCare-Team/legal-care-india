import Link from 'next/link';
import {
  ShieldCheck, Search, HeartHandshake, Scale, MessageSquare, Phone, Video,
  Wallet, EyeOff, BadgeCheck, Clock, MapPin, ArrowRight, Info,
} from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container, Section, Heading, Button } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import SectionReveal from '@/components/shared/SectionReveal';
import JsonLd from '@/components/shared/JsonLd';
import { webPageSchema, breadcrumbSchema } from '@/lib/schema';
import { getPlatformStats } from '@/lib/stats';
import { getAllCities } from '@/lib/cities';
import { CATEGORIES } from '@/data/categories';
import { formatCompactNumber, pluralize } from '@/utils/formatters';

export const metadata = createMetadata({
  title: 'About Us',
  description:
    'Legal Care India is a lawyer directory where clients find verified advocates and consult them anonymously by chat, call or video — at fees each advocate states upfront.',
  path: '/about',
});

const VALUES = [
  { icon: ShieldCheck, title: 'Verified before published', text: 'A profile is reviewed against the Bar Council details it claims before it appears in the directory at all.' },
  { icon: Search, title: 'Findable by what matters', text: 'Filter by practice area, city, language, years in practice and fee — not by who paid for placement.' },
  { icon: HeartHandshake, title: 'Direct, with no middleman', text: 'You speak to the advocate. Nobody sits between you, and nobody takes a cut of your case.' },
  { icon: Scale, title: 'Fair to advocates too', text: 'Advocates set their own durations and their own prices. We do not fix either, and we do not undercut them.' },
];

/** The three ways a consultation actually happens on the platform. */
const CHANNELS = [
  {
    icon: MessageSquare,
    title: 'Live chat',
    text: 'A time-boxed text session. The whole conversation is saved, so booking the same advocate again picks up exactly where you left off rather than starting over.',
  },
  {
    icon: Phone,
    title: 'Phone call',
    text: 'Your phone rings and the advocate is joined once you answer. Neither side sees the other\'s number — the call is bridged, not connected directly.',
  },
  {
    icon: Video,
    title: 'Video call',
    text: 'A browser-to-browser video consultation. The stream is peer-to-peer, so it never passes through our servers and costs no more than the session you booked.',
  },
];

/** What a client does, in order. */
const CLIENT_STEPS = [
  { title: 'Search', text: 'Look by practice area and city, or by what your matter actually is — bail, maintenance, eviction, a cheque that bounced.' },
  { title: 'Compare', text: 'Every profile shows years in practice, courts practised in, languages, real client reviews and the consultation fee, stated before you commit.' },
  { title: 'Top up your wallet', text: 'Add the amount you intend to spend. Nothing is charged until an advocate accepts your request.' },
  { title: 'Consult', text: 'Send a request for the duration you want. The advocate accepts, the session opens, and the fee moves only then.' },
];

/** What an advocate does, in order. */
const ADVOCATE_STEPS = [
  { title: 'Register', text: 'Bar Council number, practice areas, courts, languages, city and the fee you want to charge.' },
  { title: 'Get reviewed', text: 'Your profile stays private until it has been checked. Nothing half-finished goes live under your name.' },
  { title: 'Set your own rates', text: 'Add your own durations and prices — separately for chat, phone and video. Nobody sets them for you.' },
  { title: 'Take clients', text: 'Go online when you are available, accept the requests that suit you, and your earnings are credited as sessions connect.' },
];

export default async function AboutPage() {
  // Live figures, the same ones the homepage band counts (see lib/stats).
  const [stats, cities] = await Promise.all([getPlatformStats(), getAllCities()]);

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            type: 'AboutPage',
            name: 'About Legal Care India',
            description:
              'Legal Care India is a lawyer directory where clients find verified advocates and consult them anonymously by chat, call or video.',
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
        subtitle="A directory where every advocate is verified before they are listed, states their fee upfront, and can be consulted without you giving up your name."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About' }]}
      />

      {/* ── Live figures ──────────────────────────────────────────────── */}
      <Section spacing="default">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-ink/8 bg-surface p-5 text-center shadow-card sm:p-6"
            >
              <p className="font-display text-2xl font-semibold text-primary sm:text-3xl">
                {formatCompactNumber(s.value)}
                {s.suffix}
              </p>
              <p className="mt-1 text-xs text-ink/55 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── What this is ──────────────────────────────────────────────── */}
      <SectionReveal>
        <Section spacing="sm">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                What we are
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
                A directory, not a law firm
              </h2>
              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink/70">
                <p>
                  Finding a lawyer in India usually runs on whoever a relative happens to know.
                  That works if the right person is in your circle and fails completely if they
                  are not — and it tells you nothing about whether the advocate has ever handled
                  a matter like yours, or what they are going to charge you for saying so.
                </p>
                <p>
                  Legal Care India exists to replace that. Advocates register with their Bar
                  Council details, their practice areas, the courts they appear in and the
                  languages they work in. Every one of them is reviewed before their profile is
                  published, and every one of them states their consultation fee on the profile
                  itself. You compare, you choose, and you speak to the person you chose.
                </p>
                <p>
                  We are not a law firm and we take no part in your matter. No advocate on this
                  platform works for us, and nothing on this site is legal advice — the advice
                  comes from the advocate you consult, and the professional relationship is
                  between the two of you.
                </p>
              </div>
            </div>

            <aside className="rounded-3xl border border-ink/8 bg-muted/40 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">
                Coverage today
              </p>
              <dl className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">Cities with their own page</dt>
                    <dd className="font-semibold text-ink">{cities.length}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Scale className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">Practice areas</dt>
                    <dd className="font-semibold text-ink">
                      {pluralize(CATEGORIES.length, 'area')}, each with its own matters
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-ink/50">Listing policy</dt>
                    <dd className="font-semibold text-ink">Reviewed before published</dd>
                  </div>
                </div>
              </dl>
              <Link
                href="/cities"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark"
              >
                Browse every city
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </Section>
      </SectionReveal>

      {/* ── Anonymity ─────────────────────────────────────────────────── */}
      <SectionReveal>
        <Section spacing="sm" className="bg-muted/40">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                Privacy
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold text-ink sm:text-3xl">
                You can ask without saying who you are
              </h2>
              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink/70">
                <p>
                  A great many people never ask a lawyer anything, because the asking itself
                  feels like an admission — a family matter, a notice from the bank, an FIR
                  against a relative. So anonymity here is a setting, not a marketing line.
                </p>
                <p>
                  Turn it on in your account and advocates see your matter, not your name. Phone
                  consultations are bridged rather than dialled, so your number is never shown to
                  them either. You can turn it off whenever you want the advocate to know exactly
                  who they are speaking to.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: EyeOff, title: 'Name withheld', text: 'With anonymous mode on, the advocate sees “Anonymous” in place of your name.' },
                { icon: Phone, title: 'Number never shared', text: 'Calls are joined through a bridge, so neither side learns the other\'s number.' },
                { icon: Wallet, title: 'No charge until accepted', text: 'Your wallet is debited only when an advocate accepts. A declined request costs nothing.' },
                { icon: Clock, title: 'Unused time comes back', text: 'End a session early and the leftover minutes can be reconnected once, free, within 24 hours.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3.5 text-[15px] font-semibold text-ink">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </SectionReveal>

      {/* ── The three channels ────────────────────────────────────────── */}
      <SectionReveal>
        <Section spacing="sm">
          <Heading
            centered
            eyebrow="How you consult"
            subtitle="Three ways to reach the advocate you choose. Each is priced separately by the advocate, and each price is on their profile before you book."
          >
            Chat, phone or video
          </Heading>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {CHANNELS.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-3xl border border-ink/8 bg-surface p-6 shadow-card"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-brand">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{text}</p>
              </div>
            ))}
          </div>
        </Section>
      </SectionReveal>

      {/* ── How it works, both sides ──────────────────────────────────── */}
      <SectionReveal>
        <Section spacing="sm" className="bg-muted/40">
          <Heading centered eyebrow="How it works">
            Four steps, whichever side you are on
          </Heading>
          <div className="mt-9 grid gap-6 lg:grid-cols-2">
            {[
              { who: 'If you need a lawyer', steps: CLIENT_STEPS, href: '/lawyers', cta: 'Find a lawyer' },
              { who: 'If you are a lawyer', steps: ADVOCATE_STEPS, href: '/register', cta: 'Register your practice' },
            ].map(({ who, steps, href, cta }) => (
              <div
                key={who}
                className="flex flex-col rounded-3xl border border-ink/8 bg-surface p-6 shadow-card"
              >
                <h3 className="font-display text-lg font-bold text-ink">{who}</h3>
                <ol className="mt-5 flex-1 space-y-4">
                  {steps.map((step, i) => (
                    <li key={step.title} className="flex gap-3.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 font-display text-sm font-bold text-primary">
                        {i + 1}
                      </span>
                      <div>
                        <h4 className="text-[15px] font-semibold leading-snug text-ink">
                          {step.title}
                        </h4>
                        <p className="mt-1 text-sm leading-relaxed text-ink/60">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Button href={href} variant="outline" size="sm" className="mt-6 w-fit">
                  {cta}
                </Button>
              </div>
            ))}
          </div>
        </Section>
      </SectionReveal>

      {/* ── Values ───────────────────────────────────────────────────── */}
      <SectionReveal>
        <Section spacing="sm">
          <Heading centered eyebrow="What we stand for">
            Our values
          </Heading>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{text}</p>
              </div>
            ))}
          </div>
        </Section>
      </SectionReveal>

      {/* ── The honest limits ────────────────────────────────────────── */}
      <SectionReveal>
        <Container className="pb-4">
          <div className="flex gap-4 rounded-3xl border border-ink/10 bg-surface p-5 shadow-card sm:p-6">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-ink/45">
              <Info className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                What Legal Care India does not do
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/65">
                <li>
                  We do not give legal advice. Nothing on this site is a substitute for
                  consulting an advocate about your own facts.
                </li>
                <li>
                  We do not represent you, appear for you, or take instructions in your matter.
                  Advocates listed here are independent practitioners, not our employees.
                </li>
                <li>
                  We do not guarantee any outcome, and we do not rank advocates by what they pay.
                  Verification confirms who someone is — it is not a promise about how your case
                  will end.
                </li>
                <li>
                  We do not take a share of the advocate&apos;s fee for your case. What you see on
                  the profile is what the consultation costs.
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </SectionReveal>

      {/* ── Closing CTA ──────────────────────────────────────────────── */}
      <Container className="pb-16 pt-8">
        <div className="rounded-3xl bg-gradient-to-br from-secondary to-primary px-6 py-12 text-center sm:px-12">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Are you an advocate?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-white/80">
            Create your verified profile, set your own consultation rates, and start taking
            clients who are looking for exactly what you practise.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/register" variant="accent" size="lg">
              Register as an advocate
            </Button>
            <Button href="/lawyers" size="lg" className="bg-white/10 text-white hover:bg-white/20">
              Find a lawyer
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
