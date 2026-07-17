import { redirect } from 'next/navigation';
import { MessagesSquare, Clock, CalendarCheck, MessageCircle, Wallet } from 'lucide-react';
import { Avatar } from '@/components/ui';
import RemoveConsultationButton from '@/components/dashboard/RemoveConsultationButton';
import ViewConversationButton from '@/components/consultation/ViewConversationButton';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateConsultations } from '@/lib/consultations';
import { formatDate } from '@/utils/formatters';

export const metadata = {
  title: 'Consultations | Legal Care India',
  robots: { index: false, follow: false },
};

/** Presentation for each consultation status (advocate's point of view). */
const STATUS_META = {
  ended: { label: 'Completed', tone: 'bg-emerald-500/10 text-emerald-700' },
  active: { label: 'Ongoing', tone: 'bg-blue-500/10 text-blue-700' },
  pending: { label: 'Missed', tone: 'bg-amber-500/10 text-amber-700' },
  rejected: { label: 'You declined', tone: 'bg-red-500/10 text-red-600' },
  cancelled: { label: 'Client cancelled', tone: 'bg-ink/10 text-ink/50' },
};

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

function ConsultationCard({ item: c }) {
  const meta = STATUS_META[c.status] || STATUS_META.cancelled;
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3">
        <Avatar name={c.userName} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-display text-base font-semibold text-ink">{c.userName}</p>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
              {meta.label}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-ink/40">{formatDate(c.createdAt)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className={`text-sm font-semibold ${c.charged ? 'text-emerald-600' : 'text-ink/35'}`}>
            {c.charged ? `+${money(c.price)}` : '—'}
          </span>
          {c.charged && (
            <ViewConversationButton id={c.id} otherName={c.userName} viewerRole="advocate" />
          )}
          {c.status !== 'active' && <RemoveConsultationButton id={c.id} name={c.userName} />}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-ink/8 pt-3 text-xs text-ink/60">
        <span className="inline-flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
          Booked {c.minutes} min
        </span>
        {c.charged && (
          <>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
              Talked {c.talkedMinutes} min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
              {c.messagesCount} {c.messagesCount === 1 ? 'message' : 'messages'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default async function ConsultationsPage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');

  // Rows the advocate cleared drop out of the list and the totals alike.
  const all = await getAdvocateConsultations(id);
  const consultations = all.filter((c) => !c.hidden);
  const connected = consultations.filter((c) => c.charged);
  const earned = connected.reduce((sum, c) => sum + c.price, 0);
  const minutes = connected.reduce((sum, c) => sum + c.talkedMinutes, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Consultations</h1>
        <p className="mt-1 text-sm text-ink/55">
          Clients who booked a live chat with you — how long you talked and what you earned.
        </p>
      </div>

      {consultations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink/40">
            <MessagesSquare className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink/70">No consultations yet</p>
            <p className="mt-0.5 text-xs text-ink/45">
              Add your chat plans in Edit Profile and stay online — bookings will show up here.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Wallet className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="mt-3 font-display text-2xl font-semibold text-ink">{money(earned)}</p>
              <p className="text-xs text-ink/50">Total earned</p>
            </div>
            <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <MessagesSquare className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="mt-3 font-display text-2xl font-semibold text-ink">{connected.length}</p>
              <p className="text-xs text-ink/50">Consultations done</p>
            </div>
            <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
                <Clock className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="mt-3 font-display text-2xl font-semibold text-ink">{minutes}</p>
              <p className="text-xs text-ink/50">Minutes talked</p>
            </div>
          </div>

          <div className="space-y-4">
            {consultations.map((c) => (
              <ConsultationCard key={c.id} item={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
