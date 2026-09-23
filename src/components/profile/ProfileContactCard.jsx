import { Clock, Wifi } from 'lucide-react';
import { cn } from '@/utils/cn';
import { zoneLabel } from '@/utils/timezones';
import { SideCard } from './ProfileCoverage';

/** A schedule as a list of day/hours rows, greying out a day marked closed. */
function ScheduleList({ rows }) {
  return (
    <ul className="divide-y divide-ink/[0.06] text-[13.5px]">
      {rows.map((t) => (
        <li key={t.day} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
          <span className="text-ink/60">{t.day}</span>
          <span className={cn('font-semibold', t.open === false ? 'text-ink/40' : 'text-ink/85')}>
            {t.hours}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * ProfileContactCard — when this lawyer is usually reachable, in the sidebar
 * beside the profile body: when they are usually online for a live chat, call
 * or video consultation, and separately, the office's hours.
 *
 * The rates and the consult actions used to live here. They are in the header
 * now, beside the name, where the question they answer is the one a visitor
 * arrives with — down here they sat below the fold on a laptop, so the first
 * thing anyone saw of a paid service was the About text.
 *
 * What is left is the practical detail you want *after* deciding: when to
 * expect them. Each card renders nothing when the lawyer has not filled that
 * one in, rather than pinning an empty panel beside the page — and "usually
 * online" is never invented the way the office hours below can be (see
 * lib/advocates.js): the actual Online/Offline badge is what settles whether
 * they can be reached right now, and a made-up schedule would only disagree
 * with it.
 *
 * @param {object} props
 * @param {object} props.advocate  full profile
 */
export default function ProfileContactCard({ advocate }) {
  const online = (advocate.availabilitySchedule || []).filter((t) => t && t.day && t.hours);
  const office = (advocate.timing || []).filter((t) => t && t.day && t.hours);
  if (online.length === 0 && office.length === 0) return null;

  return (
    <>
      {online.length > 0 && (
        <SideCard icon={Wifi} title="Usually Online">
          <ScheduleList rows={online} />
          <p className="mt-2.5 text-[11.5px] text-ink/40">
            Times shown in {zoneLabel(advocate.timezone || 'Asia/Kolkata')}.
          </p>
        </SideCard>
      )}
      {office.length > 0 && (
        <SideCard icon={Clock} title="Office Timing">
          <ScheduleList rows={office} />
        </SideCard>
      )}
    </>
  );
}
