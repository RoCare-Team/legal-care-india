'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, IndianRupee, MessagesSquare, Wallet, ShieldCheck, Minimize2 } from 'lucide-react';
import ChatPanel from '../ChatPanel';
import { chargeForDuration, formatRate } from '@/constants/callRates';

function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function Meter({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink/8 bg-surface px-3 py-2.5">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-ink/50">{label}</p>
        <p className="font-semibold tabular-nums text-ink">{value}</p>
      </div>
    </div>
  );
}

/**
 * LiveConsultationWindow — the lawyer's live chat as a proper app window: the
 * conversation on the left, and on desktop a panel on the right with who the
 * client is and what the session has run to. Full screen on phones.
 *
 * @param {object} props
 * @param {object} props.session
 * @param {(text:string)=>Promise<void>} props.onSend
 * @param {()=>void} props.onEnd
 * @param {()=>void} props.onMinimize
 * @param {(live:boolean)=>void} props.onCallActiveChange
 */
export default function LiveConsultationWindow({ session, onSend, onEnd, onMinimize, onCallActiveChange }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => setMounted(true), []);

  const active = session.status === 'active';
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  if (!mounted) return null;

  const started = session.startedAt ? new Date(session.startedAt).getTime() : null;
  const elapsed = started ? now - started : 0;
  const earned = started && session.rate ? chargeForDuration(elapsed, session.rate).amount : 0;
  const left = session.endsAt ? Math.max(0, new Date(session.endsAt).getTime() - now) : null;
  const letter = String(session.userName || 'C').trim().charAt(0).toUpperCase() || 'C';

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center sm:p-4 lg:p-8">
      <div className="absolute inset-0 bg-[#070D18]/60 backdrop-blur-sm" onClick={onMinimize} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Live consultation with ${session.userName}`}
        className="relative flex h-full w-full overflow-hidden bg-surface shadow-2xl sm:h-[min(88vh,46rem)] sm:max-w-5xl sm:rounded-3xl"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <ChatPanel
            session={session}
            viewerRole="advocate"
            otherName={session.userName}
            onSend={onSend}
            onEnd={onEnd}
            onMinimize={onMinimize}
            onCallActiveChange={onCallActiveChange}
            fill
          />
        </div>

        {/* Client & session panel — desktop only; the chat header covers phones. */}
        <aside className="hidden w-72 shrink-0 flex-col border-l border-ink/8 bg-muted/40 lg:flex">
          <div className="flex items-center justify-between border-b border-ink/8 px-5 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">Session</p>
            <button
              type="button"
              onClick={onMinimize}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ink/55 hover:bg-ink/5 hover:text-ink"
            >
              <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" /> Minimize
            </button>
          </div>

          <div className="flex flex-col items-center px-5 pb-5 pt-6 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary-light to-primary-dark font-display text-3xl font-semibold text-white">
              {letter}
            </span>
            <p className="mt-3 font-display text-lg font-semibold text-ink">{session.userName}</p>
            <p className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              active ? 'bg-emerald-50 text-emerald-700' : 'bg-ink/5 text-ink/50'
            }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-ink/30'}`} />
              {active ? 'Live chat consultation' : 'Consultation ended'}
            </p>
          </div>

          <div className="space-y-2.5 px-4">
            <Meter icon={Clock} label="Duration" value={fmt(elapsed)} tone="bg-primary/10 text-primary" />
            <Meter icon={IndianRupee} label="Earned so far" value={`₹${earned.toLocaleString('en-IN')}`} tone="bg-emerald-50 text-emerald-600" />
            <Meter icon={Wallet} label="Your rate" value={formatRate(session.rate) || '—'} tone="bg-accent/15 text-amber-700" />
            {left !== null && active && (
              <Meter
                icon={Clock}
                label="Client's balance lasts"
                value={fmt(left)}
                tone={left <= 60000 ? 'bg-red-50 text-red-600' : 'bg-blue-500/10 text-blue-600'}
              />
            )}
            <Meter
              icon={MessagesSquare}
              label="Messages"
              value={(session.messages || []).length}
              tone="bg-violet-50 text-violet-600"
            />
          </div>

          <p className="mt-auto flex items-start gap-2 px-5 py-4 text-[11px] leading-relaxed text-ink/45">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
            Billed per minute. Your earnings are credited to your wallet when the session ends.
          </p>
        </aside>
      </div>
    </div>,
    document.body
  );
}
