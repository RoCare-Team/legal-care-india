import Link from 'next/link';
import { Scale, Users, Inbox, Star, ArrowUpRight } from 'lucide-react';
import { adminGetCounts } from '@/lib/admin';

const CARDS = [
  {
    key: 'advocates',
    label: 'Advocates',
    hint: 'Registered advocates',
    href: '/admin/advocates',
    icon: Scale,
    ring: 'ring-primary/15',
    icon_bg: 'bg-primary/10 text-primary',
    glow: 'from-primary/10',
  },
  {
    key: 'users',
    label: 'Users',
    hint: 'Client accounts',
    href: '/admin/users',
    icon: Users,
    ring: 'ring-blue-500/15',
    icon_bg: 'bg-blue-500/10 text-blue-600',
    glow: 'from-blue-500/10',
  },
  {
    key: 'enquiries',
    label: 'Enquiries',
    hint: 'Consultation bookings',
    href: '/admin/enquiries',
    icon: Inbox,
    ring: 'ring-emerald-500/15',
    icon_bg: 'bg-emerald-500/10 text-emerald-600',
    glow: 'from-emerald-500/10',
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    hint: 'Platform reviews',
    href: '/admin/testimonials',
    icon: Star,
    ring: 'ring-amber-500/15',
    icon_bg: 'bg-amber-500/10 text-amber-600',
    glow: 'from-amber-500/10',
  },
];

export default async function AdminOverviewPage() {
  const counts = await adminGetCounts();

  return (
    <div>
      <div className="mb-7">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Overview</h2>
        <p className="mt-1 text-sm text-ink/55">Everything registered on Legal Care India, at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.key}
              href={c.href}
              className={`group relative overflow-hidden rounded-2xl border border-ink/8 bg-surface p-5 shadow-card ring-1 ${c.ring} transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover`}
            >
              {/* Corner glow */}
              <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${c.glow} to-transparent blur-2xl`} />

              <div className="relative flex items-start justify-between">
                <span className={`grid h-12 w-12 place-items-center rounded-xl ${c.icon_bg}`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <ArrowUpRight className="h-5 w-5 text-ink/20 transition-colors group-hover:text-primary" aria-hidden="true" />
              </div>

              <p className="relative mt-5 font-display text-4xl font-bold text-ink">{counts[c.key]}</p>
              <p className="relative mt-0.5 text-sm font-semibold text-ink/70">{c.label}</p>
              <p className="relative text-xs text-ink/45">{c.hint}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
