import { BadgeCheck, Search, Phone, TrendingUp } from 'lucide-react';

/**
 * RegisterAside — value-proposition panel shown beside the registration wizard.
 */
const BENEFITS = [
  { icon: Search, title: 'Get Discovered', text: 'Appear in searches by clients looking for your legal services in your city.' },
  { icon: Phone, title: 'Direct Enquiries', text: 'Clients call, WhatsApp or email you directly — no middlemen, no commission.' },
  { icon: BadgeCheck, title: 'Verified Badge', text: 'Build trust with a verified profile backed by your Bar Council details.' },
  { icon: TrendingUp, title: 'Grow Your Practice', text: 'A premium public profile with reviews, gallery and credentials — free to start.' },
];

export default function RegisterAside() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-primary p-8 text-white">
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl"
        aria-hidden="true"
      />
      <h2 className="relative font-display text-2xl font-semibold">
        Grow your practice with Legal Care India
      </h2>
      <p className="relative mt-2 text-sm text-white/80">
        Join thousands of lawyers reaching clients who need them — build a premium public profile
        in minutes.
      </p>

      <ul className="relative mt-8 space-y-5">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="mt-0.5 text-sm text-white/75">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
