import { cn } from '@/utils/cn';

/**
 * DashboardStatCard — compact KPI tile for the dashboard overview.
 *
 * @param {object} props
 * @param {import('react').ElementType} props.icon
 * @param {string|number} props.value
 * @param {string} props.label
 * @param {string} [props.trend]     e.g. "+12% this week"
 * @param {string} [props.tone='primary']  'primary'|'secondary'|'accent'|'success'
 */
const TONES = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  accent: 'bg-accent/15 text-amber-700',
  success: 'bg-emerald-50 text-emerald-600',
};

export default function DashboardStatCard({ icon: Icon, value, label, trend, tone = 'primary' }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className={cn('grid h-10 w-10 place-items-center rounded-xl', TONES[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {trend && <span className="text-xs font-medium text-emerald-600">{trend}</span>}
      </div>
      <p className="mt-4 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-ink/55">{label}</p>
    </div>
  );
}
