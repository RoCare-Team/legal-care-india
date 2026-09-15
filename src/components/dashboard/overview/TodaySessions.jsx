import Link from 'next/link';
import { CalendarDays, MessagesSquare, PhoneCall, Video } from 'lucide-react';
import { istTime } from '@/lib/dashboardOverview';

const TYPE = {
  chat: { label: 'Chat Consultation', icon: MessagesSquare },
  audio: { label: 'Audio Consultation', icon: PhoneCall },
  video: { label: 'Video Consultation', icon: Video },
};

const STATUS = {
  active: { label: 'Ongoing', tone: 'bg-blue-500/10 text-blue-700' },
  pending: { label: 'Missed', tone: 'bg-amber-500/10 text-amber-700' },
  rejected: { label: 'Declined', tone: 'bg-red-500/10 text-red-600' },
  cancelled: { label: 'Cancelled', tone: 'bg-ink/10 text-ink/50' },
  ended: { label: 'Completed', tone: 'bg-emerald-500/10 text-emerald-700' },
};

/**
 * Today's Schedule — every session from today, in the order it happened.
 *
 * @param {object} props
 * @param {Array} props.sessions  today's history rows, oldest first
 */
export default function TodaySessions({ sessions }) {
  return (
    <section className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
          Today&apos;s Schedule
        </h2>
        <Link href="/dashboard/consultations" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      {sessions.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted/60 px-4 py-4 text-sm text-ink/55">
          No sessions yet today. Everything you take today lines up here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {sessions.map((c) => {
            const type = TYPE[c.type] || TYPE.chat;
            const status = STATUS[c.status] || STATUS.cancelled;
            const Icon = type.icon;
            const [time, meridiem] = istTime(c.startedAt || c.createdAt).split(' ');
            const initial = String(c.userName || 'C').charAt(0).toUpperCase();
            return (
              <li key={c.id} className="flex items-center gap-3 rounded-xl border border-ink/8 p-3 sm:gap-4 sm:p-4">
                <div className="w-14 shrink-0 border-r border-ink/8 pr-3 text-center leading-tight sm:w-16">
                  <p className="font-display text-base font-semibold text-ink">{time}</p>
                  <p className="text-xs font-semibold text-ink/50">{meridiem}</p>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-base font-semibold text-primary" aria-hidden="true">
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{c.userName}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink/55">
                    <span className="inline-flex items-center gap-1">
                      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      {type.label}
                    </span>
                    {c.talkedMinutes > 0 && (
                      <>
                        <span className="text-ink/25">•</span>
                        {c.talkedMinutes} mins
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>
                    {status.label}
                  </span>
                  {c.charged && (
                    <span className="text-sm font-semibold text-emerald-600">
                      +₹{Number(c.earning).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
