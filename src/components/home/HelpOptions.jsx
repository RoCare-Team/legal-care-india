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

const BADGE_TONES = {
  navy: 'bg-primary-dark text-white',
  gold: 'bg-gradient-to-r from-[#B8912A] to-[#D4AF37] text-primary-dark',
  emerald: 'bg-emerald-600 text-white',
  amber: 'bg-amber-500 text-white',
};

export default async function HelpOptions() {
  const all = await getAllAdvocates();
  const callFrom = lowestRate(all, ['audio', 'video']);
  const chatFrom = lowestRate(all, ['chat']);

  const OPTIONS = [
    {
      badge: 'Most booked',
      tone: 'navy',
      icon: PhoneCall,
      iconBg: 'from-primary-light to-primary-dark',
      title: 'Speak to an Advocate',
      body: 'Get on an audio or video call with a Bar-verified advocate — in Hindi, English or your own language.',
      meta: callFrom ? `Calls from ₹${callFrom}/min` : 'Pay per minute',
      cta: 'Call now',
      href: '/lawyers',
    },
    {
      badge: '100% private',
      tone: 'gold',
      featured: true,
      icon: MessagesSquare,
      iconBg: 'from-[#D4AF37] to-[#A67C1F]',
      title: 'Legal Chat',
      body: 'Type out your problem and get clear, written advice from a lawyer — without sharing your name or number.',
      meta: chatFrom ? `Chat from ₹${chatFrom}/min` : 'Pay per minute',
      cta: 'Start chat',
      href: '/lawyers',
    },
    {
      badge: 'Ready in 2 min',
      tone: 'emerald',
      icon: ScanSearch,
      iconBg: 'from-emerald-500 to-emerald-700',
      title: 'Smart Document Check',
      body: 'AI reads every clause and flags hidden risks, one-sided terms and anything important that is missing.',
      meta: `₹${AI_REVIEW_FEE} flat`,
      cta: 'Check document',
      href: '/document-review#start',
    },
    {
      badge: 'Expert opinion',
      tone: 'amber',
      icon: FileCheck2,
      iconBg: 'from-amber-500 to-orange-600',
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
        {OPTIONS.map(({ badge, tone, featured, icon: Icon, iconBg, title, body, meta, cta, href }) => (
          <div
            key={title}
            className={`relative flex flex-col rounded-2xl bg-white p-6 pt-8 transition-all duration-200 ${
              featured
                ? 'border-2 border-accent shadow-[0_18px_40px_-22px_rgba(212,175,55,0.7)]'
                : 'border border-ink/8 shadow-card hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(30,58,95,0.4)]'
            }`}
          >
            <span
              className={`absolute -top-3 left-5 rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide ${BADGE_TONES[tone]}`}
            >
              {badge}
            </span>

            <span className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm ${iconBg}`}>
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
