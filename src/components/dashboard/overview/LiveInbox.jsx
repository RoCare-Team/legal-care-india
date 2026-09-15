'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BellRing, MessagesSquare, PhoneCall, Video, X, Check, Loader2, PhoneOff, Radio, Clock,
} from 'lucide-react';
import { formatRate } from '@/constants/callRates';
import { useAvailability } from '@/hooks/useAvailability';

/**
 * The lawyer's live inbox — pending requests and running sessions — polled
 * from /api/consultations and shared by the pieces of the overview that show
 * it. The global AdvocateCallListener still owns ringing and opening the chat
 * or video window; accepting from here simply hands it an active session on
 * its next poll.
 */
const InboxContext = createContext({ sessions: [], loaded: false, refresh: () => {} });

const POLL_MS = 4000;

export function LiveInboxProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/consultations', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setSessions(data.sessions || []);
      setLoaded(true);
    } catch {
      /* transient — the next tick tries again */
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <InboxContext.Provider value={{ sessions, loaded, refresh }}>{children}</InboxContext.Provider>
  );
}

export const useInbox = () => useContext(InboxContext);

const TYPE_META = {
  chat: { label: 'Chat', icon: MessagesSquare },
  audio: { label: 'Audio Call', icon: PhoneCall },
  video: { label: 'Video Call', icon: Video },
};

/** Re-renders every second while mounted, for "2 mins ago" and call timers. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function ago(iso, now) {
  const sec = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  return `${min} min${min === 1 ? '' : 's'} ago`;
}

function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function Initial({ name, tone = 'bg-primary/10 text-primary' }) {
  const letter = String(name || 'C').trim().charAt(0).toUpperCase() || 'C';
  return (
    <span
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-lg font-semibold ${tone}`}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

function CountBadge({ count, tone }) {
  if (!count) return null;
  return (
    <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold text-white ${tone}`}>
      {count}
    </span>
  );
}

function PanelHeader({ icon: Icon, title, count, tone }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        {title}
        <CountBadge count={count} tone={tone} />
      </h2>
      <Link href="/dashboard/consultations" className="text-sm font-medium text-primary hover:underline">
        See All
      </Link>
    </div>
  );
}

/** The live count of requests waiting on the lawyer, for the stat row. */
export function PendingRequestsValue() {
  const { sessions, loaded } = useInbox();
  if (!loaded) return <span className="text-ink/30">–</span>;
  return sessions.filter((s) => s.status === 'pending').length;
}

async function patch(id, action) {
  const res = await fetch(`/api/consultations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, error: data.error };
}

/**
 * Incoming Requests — clients waiting for the lawyer to accept, with Accept and
 * Decline right on the row.
 *
 * @param {object} props
 * @param {boolean} props.initialAvailable
 */
export function IncomingRequests({ initialAvailable }) {
  const { sessions, loaded, refresh } = useInbox();
  const { available } = useAvailability(initialAvailable);
  const now = useNow();
  const [busy, setBusy] = useState('');
  const [notes, setNotes] = useState({});

  const pending = sessions.filter((s) => s.status === 'pending');
  // One live session at a time — the call window can only hold one.
  const inSession = sessions.some((s) => s.status === 'active');

  const act = async (id, action) => {
    setBusy(`${id}:${action}`);
    setNotes((n) => ({ ...n, [id]: '' }));
    const res = await patch(id, action);
    if (!res.ok) {
      const message =
        res.status === 402
          ? 'The client no longer has enough wallet balance.'
          : res.status === 409
            ? 'This request is no longer available.'
            : res.error || 'Something went wrong.';
      setNotes((n) => ({ ...n, [id]: message }));
    }
    await refresh();
    setBusy('');
  };

  return (
    <section id="requests" className="scroll-mt-24 rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
      <PanelHeader icon={BellRing} title="Incoming Requests" count={pending.length} tone="bg-red-500" />

      {!loaded ? (
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-ink/[0.04]" />
      ) : pending.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-ink/15 px-4 py-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/40">
            <BellRing className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink/70">No requests right now</p>
            <p className="mt-0.5 text-xs text-ink/45">
              {available
                ? 'You are online — new chat and call requests will appear here instantly.'
                : 'You are offline. Go online so clients can reach you.'}
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {pending.map((s) => {
            const meta = TYPE_META[s.type] || TYPE_META.chat;
            const Icon = meta.icon;
            const phone = s.type === 'audio';
            return (
              <li key={s.id} className="rounded-xl border border-ink/8 p-4 transition-colors hover:border-primary/20">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    <Initial name={s.userName} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{s.userName || 'Client'}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-ink/60">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                          {s.isResume ? `Resume ${meta.label}` : `${meta.label} Request`}
                        </span>
                        {s.rate > 0 && <span className="text-ink/45">{formatRate(s.rate)}</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-ink/40">{ago(s.createdAt, now)}</p>
                    </div>
                  </div>

                  {phone ? (
                    <span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:self-center">
                      <PhoneCall className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
                      Ringing on your phone
                    </span>
                  ) : (
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => act(s.id, 'reject')}
                        disabled={Boolean(busy)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-300 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 sm:flex-none"
                      >
                        {busy === `${s.id}:reject` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" aria-hidden="true" />
                        )}
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => act(s.id, 'accept')}
                        disabled={Boolean(busy) || inSession}
                        title={inSession ? 'Finish your current consultation first' : undefined}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50 sm:flex-none"
                      >
                        {busy === `${s.id}:accept` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" aria-hidden="true" />
                        )}
                        Accept
                      </button>
                    </div>
                  )}
                </div>
                {notes[s.id] && <p className="mt-2 text-xs text-red-600">{notes[s.id]}</p>}
                {!phone && inSession && (
                  <p className="mt-2 text-xs text-ink/45">Finish your current consultation to accept this one.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Active Consultations — sessions running right now, with a live timer. */
export function ActiveConsultations() {
  const { sessions, loaded, refresh } = useInbox();
  const now = useNow();
  const [ending, setEnding] = useState('');

  const active = sessions.filter((s) => s.status === 'active');

  const end = async (s) => {
    if (!window.confirm(`End the consultation with ${s.userName || 'this client'}?`)) return;
    setEnding(s.id);
    await patch(s.id, 'end');
    await refresh();
    setEnding('');
  };

  return (
    <section className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
      <PanelHeader icon={Radio} title="Active Consultations" count={active.length} tone="bg-emerald-500" />

      {!loaded ? (
        <div className="mt-4 h-20 animate-pulse rounded-xl bg-ink/[0.04]" />
      ) : active.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted/60 px-4 py-4 text-sm text-ink/55">
          No consultation is running. Accepted chats and calls show here with a live timer.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {active.map((s) => {
            const meta = TYPE_META[s.type] || TYPE_META.chat;
            const started = s.startedAt ? new Date(s.startedAt).getTime() : now;
            const left = s.endsAt ? new Date(s.endsAt).getTime() - now : null;
            return (
              <li key={s.id} className="flex items-center gap-3.5 rounded-xl border border-ink/8 p-4">
                <span className="relative">
                  <Initial name={s.userName} />
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{s.userName || 'Client'}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 font-medium text-red-600">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                      Ongoing {meta.label}
                    </span>
                    <span className="text-ink/30">•</span>
                    <span className="font-semibold tabular-nums text-ink">{clock(now - started)}</span>
                  </p>
                  {left !== null && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink/45">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {clock(left)} left · {formatRate(s.rate)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => end(s)}
                  disabled={ending === s.id}
                  aria-label={`End consultation with ${s.userName || 'client'}`}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-red-500 text-white shadow-md transition-colors hover:bg-red-600 disabled:opacity-60"
                >
                  {ending === s.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <PhoneOff className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
