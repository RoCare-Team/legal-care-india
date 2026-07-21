import Link from 'next/link';
import { Scale, Users, Star, MessagesSquare, ArrowUpRight, Sparkles } from 'lucide-react';
import { adminGetCounts, adminGetOverviewMetrics } from '@/lib/admin';
import MetricTrendCard from '@/components/admin/MetricTrendCard';

/** "Today" highlight cards — new activity since midnight. */
const TODAY_CARDS = [
  { key: 'advocates', label: 'New lawyers', href: '/admin/advocates', icon: Scale, tone: 'bg-primary/10 text-primary' },
  { key: 'users', label: 'New users', href: '/admin/users', icon: Users, tone: 'bg-blue-500/10 text-blue-600' },
  { key: 'consultations', label: 'New consultations', href: '/admin/consultations', icon: MessagesSquare, tone: 'bg-violet-500/10 text-violet-600' },
];

const CARDS = [
  {
    key: 'advocates',
    label: 'Lawyers',
    hint: 'Registered lawyers',
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
    key: 'consultations',
    label: 'Consultations',
    hint: 'Paid live-chat sessions',
    href: '/admin/consultations',
    icon: MessagesSquare,
    ring: 'ring-violet-500/15',
    icon_bg: 'bg-violet-500/10 text-violet-600',
    glow: 'from-violet-500/10',
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
  const [counts, metrics] = await Promise.all([
    adminGetCounts(),
    adminGetOverviewMetrics(14),
  ]);

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Overview</h2>
        <p className="mt-1 text-sm text-ink/55">Everything registered on Legal Care India, at a glance.</p>
      </div>

      {/* Today — new activity since midnight (shown first). */}
      <div className="mb-5">
        <div className="mb-2.5 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink/70">Today</h3>
          <span className="text-xs text-ink/40">since midnight</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TODAY_CARDS.map((c) => {
            const Icon = c.icon;
            const value = counts.today?.[c.key] ?? 0;
            return (
              <Link
                key={c.key}
                href={c.href}
                className="group flex items-center gap-3 rounded-xl border border-ink/8 bg-surface p-3.5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${c.tone}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-xl font-bold leading-tight text-ink">+{value}</p>
                  <p className="text-xs font-medium text-ink/55">{c.label}</p>
                </div>
                <ArrowUpRight className="ml-auto h-4 w-4 text-ink/20 transition-colors group-hover:text-primary" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Totals — compact count cards. */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.key}
              href={c.href}
              className={`group relative overflow-hidden rounded-xl border border-ink/8 bg-surface p-4 shadow-card ring-1 ${c.ring} transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover`}
            >
              {/* Corner glow */}
              <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${c.glow} to-transparent blur-2xl`} />

              <div className="relative flex items-start justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-lg ${c.icon_bg}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-ink/20 transition-colors group-hover:text-primary" aria-hidden="true" />
              </div>

              <p className="relative mt-3 font-display text-3xl font-bold text-ink">{counts[c.key]}</p>
              <p className="relative mt-0.5 text-sm font-semibold text-ink/70">{c.label}</p>
              <p className="relative text-xs text-ink/45">{c.hint}</p>
            </Link>
          );
        })}
      </div>

      {/* Activity trends — each metric gets its own stock-ticker-style card. */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MetricTrendCard
          label="Consultations"
          color="#1E3A5F"
          points={metrics.series.map((d) => ({ date: d.date, value: d.consultations }))}
          total={metrics.totals.consultations}
          growth={metrics.growth.consultations}
        />
        <MetricTrendCard
          label="Revenue"
          color="#B8860B"
          money
          points={metrics.series.map((d) => ({ date: d.date, value: d.revenue }))}
          total={metrics.totals.revenue}
          growth={metrics.growth.revenue}
        />
        <MetricTrendCard
          label="New users"
          color="#34557F"
          points={metrics.series.map((d) => ({ date: d.date, value: d.users }))}
          total={metrics.totals.users}
          growth={metrics.growth.users}
        />
      </div>
    </div>
  );
}
