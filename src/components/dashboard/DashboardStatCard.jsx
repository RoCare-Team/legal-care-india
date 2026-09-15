import { cn } from '@/utils/cn';

/**
 * DashboardStatCard — compact KPI tile for the dashboard overview.
 *
 * @param {object} props
 * @param {import('react').ElementType} props.icon
 * @param {import('react').ReactNode} props.value
 * @param {string} props.label
 * @param {import('react').ReactNode} [props.trend]  e.g. "↑ 3 today" — shown in green
 * @param {import('react').ReactNode} [props.sub]    a quieter supporting line
 * @param {string} [props.tone='primary']  'primary'|'secondary'|'accent'|'success'|'danger'|'violet'
 */
const TONES = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  accent: 'bg-accent/15 text-amber-700',
  success: 'bg-emerald-50 text-emerald-600',
  danger: 'bg-red-50 text-red-500',
  violet: 'bg-violet-50 text-violet-600',
};

export default function DashboardStatCard({ icon: Icon, value, label, trend, sub, tone = 'primary' }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-ink/8 bg-surface px-3 py-5 text-center shadow-card">
      <span className={cn('grid h-11 w-11 place-items-center rounded-xl', TONES[tone])}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-2xl font-semibold text-ink sm:text-[1.7rem]">{value}</p>
      <p className="text-sm text-ink/60">{label}</p>
      {trend && <p className="mt-1 text-sm font-semibold text-emerald-600">{trend}</p>}
      {sub && <p className="mt-1 text-xs text-ink/45">{sub}</p>}
    </div>
  );
}
