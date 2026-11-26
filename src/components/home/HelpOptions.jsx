import Link from 'next/link';
import { PhoneCall, MessagesSquare, ScanSearch, FileCheck2, ArrowRight } from 'lucide-react';
import { Section, Heading } from '@/components/ui';
import { getAllAdvocates } from '@/lib/advocates';
import { advocateRate } from '@/constants/callRates';
import { AI_REVIEW_FEE, LAWYER_RATE, EXPERT_REVIEW_HOURS } from '@/constants/documentReview';

/**
 * HelpOptions — "How would you like legal help today?": the four ways in,
 * side by side, straight after the lawyers themselves.
 *
 * The two live consultations lead with the lowest rate a lawyer on the
 * platform actually charges, read from the same lawyer list the band above
 * shows, so "from ₹X/min" is always a price someone can book. The two
 * document reviews lead to /document-review with their fixed prices.
 */

/** Lowest non-zero rate across lawyers for the given channels, or 0. */
function lowestRate(advocates, types) {
  let min = 0;
  for (const a of advocates) {
    for (const t of types) {
      const r = advocateRate(a, t);
      if (r > 0 && (!min || r < min)) min = r;
    }
  }
  return min;
}

export default async function HelpOptions() {
  const all = await getAllAdvocates();
  const callFrom = lowestRate(all, ['audio', 'video']);
  const chatFrom = lowestRate(all, ['chat']);

  const OPTIONS = [
    {
      badge: 'Most booked',
      icon: PhoneCall,
      title: 'Speak to an Advocate',
      body: 'Get on an audio or video call with a Bar-verified advocate — in Hindi, English or your own language.',
      meta: callFrom ? `Calls from ₹${callFrom}/min` : 'Pay per minute',
      cta: 'Call now',
      href: '/lawyers',
    },
    {
      badge: '100% private',
      featured: true,
      icon: MessagesSquare,
      title: 'Legal Chat',
      body: 'Type out your problem and get clear, written advice from a lawyer — without sharing your name or number.',
      meta: chatFrom ? `Chat from ₹${chatFrom}/min` : 'Pay per minute',
      cta: 'Start chat',
      href: '/lawyers',
    },
    {
      badge: 'Ready in 2 min',
      icon: ScanSearch,
      title: 'Smart Document Check',
      body: 'AI reads every clause and flags hidden risks, one-sided terms and anything important that is missing.',
      meta: `₹${AI_REVIEW_FEE} flat`,
      cta: 'Check document',
      href: '/document-review#start',
    },
    {
      badge: 'Expert opinion',
      icon: FileCheck2,
      title: 'Advocate Document Opinion',
      body: `An experienced advocate studies your document and sends a written opinion within ${EXPERT_REVIEW_HOURS} hours.`,
      meta: `From ₹${LAWYER_RATE}/page`,
      cta: 'Get opinion',
      href: '/document-review#start',
    },
  ];

  return (
    <Section spacing="sm" className="pt-10 sm:pt-14">
      <Heading
        centered
        eyebrow="Our most popular services"
        subtitle="Call, chat or get your papers checked — every option backed by verified advocates across India."
      >
        How would you like legal help today?
      </Heading>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {OPTIONS.map(({ badge, featured, icon: Icon, title, body, meta, cta, href }) => (
          <div
            key={title}
            className={`relative flex flex-col rounded-2xl bg-white p-6 pt-8 transition-all duration-200 ${
              featured
                ? 'border-2 border-primary shadow-[0_18px_40px_-24px_rgba(30,58,95,0.45)]'
                : 'border border-ink/8 shadow-card hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(30,58,95,0.4)]'
            }`}
          >
            <span
              className={`absolute -top-3 left-5 rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide ${
                featured ? 'bg-primary text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
              }`}
            >
              {badge}
            </span>

            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/[0.07] text-primary ring-1 ring-inset ring-primary/10">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>

            <h3 className="mt-5 font-display text-lg font-bold text-ink">{title}</h3>
            <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink/60">{body}</p>
            <p className="mt-4 text-[13px] font-bold text-ink">{meta}</p>

            <Link
              href={href}
              className={`mt-3 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-colors ${
                featured
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'border border-ink/12 text-ink hover:border-primary hover:bg-primary hover:text-white'
              }`}
            >
              {cta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}
