import Link from 'next/link';
import { MessageSquareText, Users, PhoneCall, ShieldCheck, IndianRupee, Clock } from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';
import JsonLd from '@/components/shared/JsonLd';
import AskQueryForm from '@/components/queries/AskQueryForm';
import { getAllCities } from '@/lib/cities';
import { countOpenQueries } from '@/lib/queries';
import { webPageSchema, breadcrumbSchema } from '@/lib/schema';

export const metadata = createMetadata({
  title: 'Ask a Lawyer Free | Post Your Legal Question — Justiceland',
  description:
    'Describe your legal problem and verified lawyers across India can pick it up and call you back. No account, no fee to ask. Property, family, criminal, consumer and more.',
  path: '/ask',
  keywords: [
    'ask a lawyer free india',
    'free legal advice india',
    'post legal question online',
    'talk to lawyer without login',
  ],
});

/** Read fresh: the waiting-questions count is the one number that moves. */
export const dynamic = 'force-dynamic';

const STEPS = [
  {
    icon: MessageSquareText,
    title: 'Describe your problem',
    body: 'Write it in your own words. No account and nothing to pay — just the matter, your city and a number to call you on.',
  },
  {
    icon: Users,
    title: 'Verified lawyers see it',
    body: 'It goes to the whole panel at once. They see the problem and the city — not your name or number.',
  },
  {
    icon: PhoneCall,
    title: 'One lawyer takes it up',
    body: 'The first lawyer to take the matter gets your contact details and calls you. Nobody else can see it after that.',
  },
];

export default async function AskPage() {
  const [cities, waiting] = await Promise.all([getAllCities(), countOpenQueries()]);

  return (
    <>
      <JsonLd
        data={[
          webPageSchema({
            name: 'Ask a Lawyer',
            description: 'Post a legal question free and a verified lawyer will call you back.',
            path: '/ask',
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Ask a Lawyer', path: '/ask' },
          ]),
        ]}
      />

      <PageHeader
        eyebrow="Free legal help"
        title="Have a legal problem? Ask a lawyer free"
        subtitle="Write what happened and leave your number. A verified lawyer will call you — no login, nothing to pay."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Ask a Lawyer' }]}
      />

      <Container className="pb-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            <AskQueryForm cities={cities.map((c) => c.name)} />
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-ink/8 bg-surface p-5 shadow-card">
              <h2 className="font-display text-lg font-semibold text-ink">How it works</h2>
              <ol className="mt-4 space-y-4">
                {STEPS.map(({ icon: Icon, title, body }, i) => (
                  <li key={title} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {i + 1}. {title}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-ink/60">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-3xl border border-accent/30 bg-accent/[0.06] p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary-dark">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {waiting > 0
                  ? `${waiting} ${waiting === 1 ? 'question is' : 'questions are'} with our lawyers right now`
                  : 'Lawyers are watching for new questions right now'}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink/60">
                Need an answer this minute instead? Start a chat or call with a lawyer who is online.
              </p>
              <Link
                href="/lawyers?availability=online"
                className="mt-3 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                See lawyers online now
              </Link>
            </div>

            <ul className="space-y-2.5 rounded-3xl border border-ink/8 bg-surface p-5 text-[13px] text-ink/65 shadow-card">
              <li className="flex items-start gap-2.5">
                <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                Asking is free. A lawyer will tell you their fee before any paid work.
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                Every lawyer on Justiceland is verified before they can take a question.
              </li>
              <li className="flex items-start gap-2.5">
                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                Questions that are answered leave the panel — nobody keeps calling you.
              </li>
            </ul>
          </aside>
        </div>
      </Container>
    </>
  );
}
