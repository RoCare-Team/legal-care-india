import { BadgeCheck, Timer, ShieldCheck } from 'lucide-react';

const POINTS = [
  { icon: BadgeCheck, title: 'Verified advocates', text: 'Every lawyer is checked before their profile goes live.' },
  { icon: Timer, title: 'Pay per minute', text: 'You are charged only for the minutes you actually use.' },
  { icon: ShieldCheck, title: 'Private & secure', text: 'Your conversation stays between you and your lawyer.' },
];

/**
 * ProfileTrustCard — why consulting through Justiceland is safe, in three
 * lines, in the brand's navy.
 *
 * Sticky on a wide screen, so the sidebar column keeps something beside a long
 * profile instead of ending under the office hours with a screen of empty page
 * below it. Every line is a promise the platform keeps today: profiles are
 * approved by an admin before they are published, and consultations bill by
 * the minute used.
 */
export default function ProfileTrustCard() {
  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-light via-primary to-primary-dark p-5 text-white shadow-brand">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Why Justiceland</p>
      <h3 className="mt-1 font-display text-[18px] font-semibold leading-snug">Consult with confidence</h3>
      <span className="mt-2.5 block h-0.5 w-10 rounded-full bg-accent" aria-hidden="true" />
      <ul className="mt-4 space-y-3.5">
        {POINTS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-accent ring-1 ring-white/15">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold">{title}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/65">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
