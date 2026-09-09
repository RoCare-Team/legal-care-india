import { UserRound, Users, TrendingUp, CalendarDays, Star } from 'lucide-react';
import ProfileSection from './ProfileSection';

/**
 * ProfileAbout — the lawyer's biography, and the four figures that stand behind
 * it.
 *
 * The figures come from the lawyer's own record, so a lawyer who has not filled
 * any of them in simply gets the paragraph. That is the point of building the
 * row from what exists rather than from a fixed set of four: a profile claiming
 * "0 clients, 0% success rate" is worse than one claiming nothing.
 *
 * "Top Rated" is the one that is derived rather than entered, and only at 4.5
 * and above — a badge every profile carries is not a badge.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileAbout({ advocate }) {
  const { metrics = {}, experience, rating, reviews } = advocate;

  const stats = [
    metrics.clients > 0 && {
      icon: Users,
      value: `${metrics.clients}+`,
      label: 'Clients',
    },
    metrics.successRate > 0 && {
      icon: TrendingUp,
      value: `${metrics.successRate}%`,
      label: 'Success Rate',
    },
    Number(experience) > 0 && {
      icon: CalendarDays,
      value: `${Math.round(Number(experience))}+`,
      label: 'Years',
    },
    // Derived, and deliberately strict: a badge everyone has is not a badge.
    Number(rating) >= 4.5 && Number(reviews) > 0 && {
      icon: Star,
      value: Number(rating).toFixed(1),
      label: 'Top Rated',
    },
  ].filter(Boolean);

  return (
    <ProfileSection id="about" title="About" icon={UserRound}>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink/70 sm:text-base">
        {advocate.about}
      </p>

      {stats.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-ink/8 pt-5 sm:grid-cols-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <Icon
                className="mx-auto h-4 w-4 text-accent"
                aria-hidden="true"
              />
              <p className="mt-1.5 font-display text-xl font-bold text-primary">{value}</p>
              <p className="mt-0.5 text-[11.5px] font-medium text-ink/50">{label}</p>
            </div>
          ))}
        </div>
      )}
    </ProfileSection>
  );
}
