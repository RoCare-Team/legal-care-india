import Link from 'next/link';
import { MessagesSquare, Clock, CalendarCheck } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { formatDate } from '@/utils/formatters';
import RemoveConsultationButton from './RemoveConsultationButton';

const STATUS_META = {
  ended: { label: 'Completed', tone: 'bg-emerald-500/10 text-emerald-700' },
  active: { label: 'Ongoing', tone: 'bg-blue-500/10 text-blue-700' },
  pending: { label: 'Missed', tone: 'bg-amber-500/10 text-amber-700' },
  rejected: { label: 'You declined', tone: 'bg-red-500/10 text-red-600' },
  cancelled: { label: 'Client cancelled', tone: 'bg-ink/10 text-ink/50' },
};

/**
 * RecentConsultations — feed of the advocate's latest live-chat consultations:
 * who booked, how long they talked and what it earned.
 *
 * @param {object} props
 * @param {Array} [props.consultations]  serialized rows, newest first
 */
export default function RecentConsultations({ consultations = [] }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Recent Consultations</h2>
        {consultations.length > 0 && (
          <Link href="/dashboard/consultations" className="text-xs font-medium text-primary hover:underline">
            View all
          </Link>
        )}
      </div>

      {consultations.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ink/15 py-10 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink/5 text-ink/40">
            <MessagesSquare className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink/70">No consultations yet</p>
            <p className="mt-0.5 text-xs text-ink/45">
              Live chats booked from your profile will appear here.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {consultations.slice(0, 4).map((c) => {
            const meta = STATUS_META[c.status] || STATUS_META.cancelled;
            return (
              <li key={c.id} className="rounded-xl border border-ink/8 p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={c.userName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-ink">{c.userName}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/55">
                      <span className="flex items-center gap-1">
                        <CalendarCheck className="h-3 w-3" aria-hidden="true" />
                        {c.minutes} min booked
                      </span>
                      {c.charged && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {c.talkedMinutes} min talked
                        </span>
                      )}
                    </p>
                    <p className="mt-1.5 text-[11px] text-ink/40">{formatDate(c.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className={`text-sm font-semibold ${c.charged ? 'text-emerald-600' : 'text-ink/35'}`}>
                      {c.charged ? `+₹${Number(c.price).toLocaleString('en-IN')}` : '—'}
                    </span>
                    {c.status !== 'active' && (
                      <RemoveConsultationButton id={c.id} name={c.userName} />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
