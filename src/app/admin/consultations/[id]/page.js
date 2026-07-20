import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Scale, User as UserIcon, ExternalLink } from 'lucide-react';
import { adminGetConsultationById } from '@/lib/admin';
import { DetailBack, InfoCard, InfoRow, StatTile, ConsultStatusPill } from '@/components/admin/DetailKit';
import { AdminAvatar } from '@/components/admin/DataTable';
import { formatDate } from '@/utils/formatters';

export const metadata = { title: 'Consultation', robots: { index: false, follow: false } };

/** "18 Jul 2026, 4:32 pm" — date plus wall-clock time for transcript lines. */
function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Just the clock time, shown inside each bubble. */
function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const sameDay = (a, b) => a.toDateString() === b.toDateString();

/** "Today" / "Yesterday" / "14 Jul 2026" for the separator chips. */
function dayLabel(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return formatDate(date.toISOString());
}

/**
 * Annotate each message with the flags a chat layout needs: whether it opens a
 * new day, and whether it starts/ends a run of messages from the same sender.
 * Only the first bubble of a run carries the sender name, only the last gets
 * the pointed corner — the way a real messenger reads.
 */
function decorate(messages, fallbackDate) {
  const ts = messages.map((m) => new Date(m.at || fallbackDate));
  return messages.map((m, i) => {
    const newDay = i === 0 || !sameDay(ts[i - 1], ts[i]);
    const nextNewDay = i === messages.length - 1 || !sameDay(ts[i], ts[i + 1]);
    return {
      ...m,
      date: ts[i],
      newDay,
      startsRun: newDay || messages[i - 1].from !== m.from,
      endsRun: nextNewDay || messages[i + 1].from !== m.from,
    };
  });
}

export default async function AdminConsultationDetailPage({ params }) {
  const { id } = await params;
  const c = await adminGetConsultationById(id);
  if (!c) notFound();

  const userMsgs = c.messages.filter((m) => m.from === 'user').length;
  const advocateMsgs = c.messages.length - userMsgs;

  return (
    <div>
      <DetailBack href="/admin/consultations" label="Back to consultations" />

      {/* Header — who talked to whom, and where the session ended up. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
        <div className="flex items-center gap-3">
          <AdminAvatar name={c.userName} tone="bg-blue-500/10 text-blue-600" />
          <div>
            <p className="font-display text-lg font-semibold text-ink">{c.userName}</p>
            <p className="text-xs text-ink/50">Client</p>
          </div>
          <span className="px-2 text-ink/25" aria-hidden="true">
            ↔
          </span>
          <AdminAvatar name={c.advocateName} tone="bg-primary/10 text-primary" />
          <div>
            <p className="font-display text-lg font-semibold text-ink">{c.advocateName}</p>
            <p className="text-xs text-ink/50">Advocate</p>
          </div>
        </div>
        <ConsultStatusPill status={c.status} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Plan" value={`${c.minutes} min`} />
        <StatTile
          label={c.charged ? 'Charged' : 'Not charged'}
          value={`₹${c.price.toLocaleString('en-IN')}`}
          tone={c.charged ? 'text-emerald-600' : 'text-ink/40'}
        />
        <StatTile label="Messages" value={c.messages.length} />
        <StatTile label="Booked" value={formatDate(c.createdAt)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Transcript — laid out like the live chat the two sides actually saw. */}
        <section className="overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-card">
          <header className="flex items-center justify-between gap-3 border-b border-ink/8 bg-surface px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-base font-semibold leading-tight text-ink">Chat transcript</h3>
                <p className="text-xs text-ink/45">
                  {c.userName} &amp; {c.advocateName}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/50">
              {c.messages.length} messages
            </span>
          </header>

          {c.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-5 py-20 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-ink/40">
                <MessageSquare className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-ink/60">No messages in this session.</p>
              <p className="max-w-xs text-xs text-ink/40">
                {c.status === 'pending'
                  ? 'The advocate has not accepted the request yet.'
                  : c.status === 'rejected' || c.status === 'cancelled'
                    ? 'The session never connected, so no chat took place.'
                    : 'The session connected but neither side sent a message.'}
              </p>
            </div>
          ) : (
            <ol className="max-h-[44rem] min-h-[28rem] overflow-y-auto bg-ink/[0.03] px-4 py-6 sm:px-6">
              {decorate(c.messages, c.createdAt).map((m) => {
                const fromUser = m.from === 'user';
                const who = fromUser ? c.userName : c.advocateName;
                return (
                  <li key={m.id}>
                    {m.newDay && (
                      <div className="my-5 flex items-center gap-3 first:mt-0">
                        <span className="h-px flex-1 bg-ink/8" />
                        <span className="rounded-full border border-ink/8 bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink/50 shadow-sm">
                          {dayLabel(m.date)}
                        </span>
                        <span className="h-px flex-1 bg-ink/8" />
                      </div>
                    )}

                    <div
                      className={`flex items-end gap-2.5 ${fromUser ? '' : 'flex-row-reverse'} ${
                        m.startsRun ? 'mt-4' : 'mt-1.5'
                      }`}
                    >
                      {/* Avatar sits with the last bubble of a run; earlier ones indent to match. */}
                      {m.endsRun ? (
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                            fromUser ? 'bg-blue-500/10 text-blue-600' : 'bg-primary text-white'
                          }`}
                          aria-hidden="true"
                        >
                          {fromUser ? (
                            <UserIcon className="h-4 w-4" />
                          ) : (
                            <Scale className="h-4 w-4" />
                          )}
                        </span>
                      ) : (
                        <span className="h-9 w-9 shrink-0" aria-hidden="true" />
                      )}

                      <div className="min-w-0 max-w-[72%]">
                        {m.startsRun && (
                          <p
                            className={`mb-1.5 px-1 text-xs font-semibold text-ink/50 ${
                              fromUser ? '' : 'text-right'
                            }`}
                          >
                            {who}
                          </p>
                        )}

                        <div
                          className={`flex flex-wrap items-end justify-end gap-x-3 gap-y-0.5 px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                            fromUser
                              ? `rounded-2xl border border-ink/10 bg-surface text-ink ${m.endsRun ? 'rounded-bl-md' : ''}`
                              : `rounded-2xl bg-primary text-white ${m.endsRun ? 'rounded-br-md' : ''}`
                          }`}
                        >
                          <p className="mr-auto whitespace-pre-wrap break-words">{m.text}</p>
                          <time
                            dateTime={m.at || undefined}
                            className={`shrink-0 translate-y-0.5 text-[11px] ${
                              fromUser ? 'text-ink/40' : 'text-white/65'
                            }`}
                          >
                            {formatTime(m.at)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="space-y-5">
          <InfoCard title="Session">
            <InfoRow label="Booked">{formatDateTime(c.createdAt)}</InfoRow>
            <InfoRow label="Connected">{c.startedAt ? formatDateTime(c.startedAt) : null}</InfoRow>
            <InfoRow label="Planned end">{c.endsAt ? formatDateTime(c.endsAt) : null}</InfoRow>
            <InfoRow label="Ended">{c.endedAt ? formatDateTime(c.endedAt) : null}</InfoRow>
            <InfoRow label="From client">{userMsgs}</InfoRow>
            <InfoRow label="From advocate">{advocateMsgs}</InfoRow>
          </InfoCard>

          <InfoCard title="Participants">
            <div className="space-y-2">
              {c.userId && (
                <Link
                  href={`/admin/users/${c.userId}`}
                  className="flex items-center gap-3 rounded-xl border border-ink/8 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
                >
                  <AdminAvatar name={c.userName} tone="bg-blue-500/10 text-blue-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{c.userName}</span>
                    <span className="block text-xs text-ink/45">Client profile</span>
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink/30" aria-hidden="true" />
                </Link>
              )}
              {c.advocateId && (
                <Link
                  href={`/admin/advocates/${c.advocateId}`}
                  className="flex items-center gap-3 rounded-xl border border-ink/8 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
                >
                  <AdminAvatar name={c.advocateName} tone="bg-primary/10 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{c.advocateName}</span>
                    <span className="block text-xs text-ink/45">Advocate profile</span>
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink/30" aria-hidden="true" />
                </Link>
              )}
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
