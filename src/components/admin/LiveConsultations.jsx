'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Radio, MessageSquare, Phone, Video, IndianRupee, Loader2, Percent, Tag,
  AlertCircle, CheckCircle2, X, PhoneOff, Hourglass, Scale, User as UserIcon,
} from 'lucide-react';
import { chargeForDuration, FREE_SECONDS } from '@/constants/callRates';
import { previewDiscount, MAX_DISCOUNT_NOTE } from '@/constants/discounts';
import { formatMoney, COMMISSION_LABEL } from '@/constants/payouts';

/** How often the desk re-reads what is live. Fast enough to feel present. */
const POLL_MS = 5000;

const CHANNEL = {
  chat: { label: 'Live chat', Icon: MessageSquare },
  audio: { label: 'Audio call', Icon: Phone },
  video: { label: 'Video call', Icon: Video },
};

/** "07:12" / "1:04:08" — a running session's clock. */
function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

async function post(body) {
  const res = await fetch('/api/admin/consultations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not update the session.');
  return data;
}

/**
 * The live consultation desk: every session running right now, what it has
 * cost so far, and the two things an admin can do about it — take money off
 * the bill, or end it.
 *
 * The clocks run against the server's time, not the browser's. A panel on a
 * laptop whose clock is three minutes fast would otherwise show three minutes
 * of billing that never happened, and the whole point of this screen is that
 * the number on it is the number the client is about to be charged.
 *
 * @param {object} props
 * @param {Array} props.initial     rows from adminGetLiveConsultations
 * @param {number} props.serverNow  the server's clock when those were read
 */
export default function LiveConsultations({ initial = [], serverNow = Date.now() }) {
  const [sessions, setSessions] = useState(initial);
  const [skew, setSkew] = useState(serverNow - Date.now());
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');
  const router = useRouter();
  const open = useRef(false);

  // One second for the clocks; the list itself is re-read far less often.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/consultations', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setSkew(Number(data.serverNow) - Date.now());
      // Never while a discount is being typed: replacing the list under an
      // open form closes it and throws away what the admin had entered.
      if (!open.current) setSessions(data.sessions || []);
    } catch {
      // A missed poll is not worth an error on screen; the next one is in five
      // seconds and the clocks keep running on what we have.
    }
  }, []);

  useEffect(() => {
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const serverTime = now + skew;

  const act = async (body) => {
    setError('');
    try {
      await post(body);
      await refresh();
      router.refresh();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  if (!sessions.length) {
    return (
      <section className="mb-6 rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
        <Header count={0} />
        <p className="mt-3 text-sm text-ink/50">
          Nothing is running right now. Sessions appear here the moment a client books one, and
          stay until they end.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
      <Header count={sessions.length} />

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {sessions.map((s) => (
          <SessionRow
            key={s.id}
            session={s}
            serverTime={serverTime}
            onAct={act}
            onFormOpen={(isOpen) => {
              open.current = isOpen;
            }}
          />
        ))}
      </div>
    </section>
  );
}

function Header({ count }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          {count > 0 && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
          )}
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${count > 0 ? 'bg-emerald-500' : 'bg-ink/20'}`}
          />
        </span>
        <h2 className="font-display text-lg font-semibold text-ink">Live now</h2>
        {count > 0 && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
            {count}
          </span>
        )}
      </div>
      <p className="hidden items-center gap-1.5 text-xs text-ink/45 sm:flex">
        <Radio className="h-3.5 w-3.5" aria-hidden="true" />
        Updating every {POLL_MS / 1000}s
      </p>
    </div>
  );
}

/**
 * One live session: who is talking, for how long, what it has come to, and the
 * controls over it.
 */
export function SessionRow({ session: s, serverTime, onAct, onFormOpen, showLink = true }) {
  const [mode, setMode] = useState(''); // '' | 'discount' | 'end'
  const [busy, setBusy] = useState('');

  const channel = CHANNEL[s.type] || CHANNEL.chat;
  const waiting = s.status === 'pending';
  const startedAt = s.startedAt ? new Date(s.startedAt).getTime() : null;
  const ranMs = startedAt ? Math.max(0, serverTime - startedAt) : 0;
  const waitedMs = Math.max(0, serverTime - new Date(s.createdAt).getTime());

  // What the session has run up so far, at its own rate — the same sum
  // settleCharges will do when it ends.
  const billed = useMemo(
    () => (waiting ? 0 : chargeForDuration(ranMs, s.rate).amount),
    [waiting, ranMs, s.rate]
  );
  const live = previewDiscount(billed, s.discount);

  const setOpen = (next) => {
    setMode(next);
    onFormOpen?.(Boolean(next));
  };

  const run = async (key, body) => {
    setBusy(key);
    const ok = await onAct(body);
    setBusy('');
    if (ok) setOpen('');
  };

  return (
    <div className="rounded-xl border border-ink/8 bg-bg/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Who, on what, and for how long. */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <UserIcon className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
              {s.userName}
            </span>
            <span className="text-ink/25" aria-hidden="true">
              &harr;
            </span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Scale className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
              {s.advocateName}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/6 px-2 py-0.5 text-[11px] font-medium text-ink/60">
              <channel.Icon className="h-3 w-3" aria-hidden="true" />
              {channel.label}
            </span>
            {waiting ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                <Hourglass className="h-3 w-3" aria-hidden="true" />
                Waiting {clock(waitedMs)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                <Radio className="h-3 w-3" aria-hidden="true" />
                Live {clock(ranMs)}
              </span>
            )}
          </div>

          <p className="mt-1.5 text-xs text-ink/50">
            {s.rate > 0 ? `₹${s.rate}/min` : 'No rate set'}
            {s.maxMinutes > 0 && <> · wallet covers {s.maxMinutes} min</>}
            {s.messagesCount > 0 && <> · {s.messagesCount} messages</>}
            {showLink && (
              <>
                {' · '}
                <Link href={`/admin/consultations/${s.id}`} className="text-primary hover:underline">
                  Open
                </Link>
              </>
            )}
          </p>
        </div>

        {/* What it has come to. */}
        <div className="text-right">
          {waiting ? (
            <p className="text-sm text-ink/45">Not accepted yet — nothing is being billed.</p>
          ) : (
            <>
              <p className="flex items-center justify-end font-display text-xl font-semibold text-ink">
                <IndianRupee className="h-4 w-4" aria-hidden="true" />
                {live.collected.toFixed(2)}
              </p>
              {s.discount ? (
                <p className="text-[11px] text-emerald-600">
                  <span className="text-ink/40 line-through">{formatMoney(live.billed)}</span>{' '}
                  {s.discount.label} · saving {formatMoney(live.saved)}
                </p>
              ) : (
                <p className="text-[11px] text-ink/40">so far, first {FREE_SECONDS}s free</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* The discount already on the session, and who put it there. */}
      {s.discount && (
        <p className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-emerald-500/8 px-3 py-2 text-xs text-emerald-700">
          <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="font-semibold">{s.discount.label}</span>
          {s.discount.note && <span className="text-emerald-700/75">&ldquo;{s.discount.note}&rdquo;</span>}
          {s.discount.by && <span className="text-emerald-700/60">by {s.discount.by}</span>}
          <span className="text-emerald-700/60">
            · applied when the session ends
            {live.fromAdvocate > 0 && `, ${formatMoney(live.fromAdvocate)} of it from the lawyer`}
          </span>
        </p>
      )}

      {/* ── Controls ───────────────────────────────────────────── */}
      {mode === '' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpen('discount')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/12 bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-primary/40 hover:text-primary"
          >
            <Percent className="h-3.5 w-3.5" aria-hidden="true" />
            {s.discount ? 'Change discount' : 'Give a discount'}
          </button>
          {s.discount && (
            <button
              type="button"
              disabled={busy === 'clear'}
              onClick={() => run('clear', { id: s.id, action: 'clear-discount' })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/12 bg-surface px-3 py-1.5 text-xs font-semibold text-ink/70 hover:border-ink/25 disabled:opacity-60"
            >
              {busy === 'clear' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Remove discount
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen('end')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10"
          >
            <PhoneOff className="h-3.5 w-3.5" aria-hidden="true" />
            {waiting ? 'Cancel request' : 'End session'}
          </button>
        </div>
      )}

      {mode === 'discount' && (
        <DiscountForm
          session={s}
          billed={billed}
          busy={busy === 'discount'}
          onCancel={() => setOpen('')}
          onSave={(body) => run('discount', { id: s.id, action: 'discount', ...body })}
        />
      )}

      {mode === 'end' && (
        <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
          <p className="text-sm text-ink/75">
            {waiting ? (
              <>Cancel this request? The lawyer stops being rung and nothing is charged.</>
            ) : (
              <>
                End this session now? It settles immediately — the client is charged{' '}
                <strong>{formatMoney(live.collected)}</strong>
                {s.discount && <> ({s.discount.label} applied)</>} and both screens close.
              </>
            )}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy === 'end'}
              onClick={() => run('end', { id: s.id, action: 'end' })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {busy === 'end' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PhoneOff className="h-3.5 w-3.5" />
              )}
              {waiting ? 'Yes, cancel it' : 'Yes, end it now'}
            </button>
            <button
              type="button"
              onClick={() => setOpen('')}
              className="rounded-lg border border-ink/12 bg-surface px-3 py-1.5 text-xs font-semibold text-ink/70"
            >
              Keep it running
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const QUICK = [
  { kind: 'percent', value: 10, label: '10%' },
  { kind: 'percent', value: 25, label: '25%' },
  { kind: 'percent', value: 50, label: '50%' },
  { kind: 'percent', value: 100, label: 'Free' },
];

/**
 * How much to take off, and what that means for everyone.
 *
 * The preview is the point of this form. A discount is not free money: our
 * commission pays for the first slice of it and the lawyer's share pays for
 * anything past that, so the admin is shown all three numbers before they
 * commit rather than finding out from a complaint later.
 */
function DiscountForm({ session: s, billed, busy, onCancel, onSave }) {
  const [kind, setKind] = useState(s.discount?.kind || 'percent');
  const [value, setValue] = useState(s.discount ? String(s.discount.value) : '');
  const [note, setNote] = useState(s.discount?.note || '');

  const draft = Number(value) > 0 ? { kind, value: Number(value) } : null;
  // Previewed against what the session has run up so far. It keeps running, so
  // this is what the discount would mean if it ended this second — the shares
  // move with the bill, the percentage does not.
  const preview = previewDiscount(billed, draft);
  const tooBig = Boolean(draft) && kind === 'percent' && draft.value > 100;

  return (
    <div className="mt-3 rounded-xl border border-ink/10 bg-surface p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-ink/12 p-0.5">
          {['percent', 'flat'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                kind === k ? 'bg-primary text-white' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {k === 'percent' ? '% off' : '₹ off'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-ink/12 px-2.5 py-1">
          {kind === 'flat' && <IndianRupee className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />}
          <input
            type="number"
            min="0"
            max={kind === 'percent' ? 100 : undefined}
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={kind === 'percent' ? '25' : '100'}
            className="w-20 bg-transparent text-sm font-semibold text-ink outline-none"
          />
          {kind === 'percent' && <span className="text-xs text-ink/40">%</span>}
        </div>

        {QUICK.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => {
              setKind(q.kind);
              setValue(String(q.value));
            }}
            className="rounded-lg border border-ink/12 px-2.5 py-1 text-xs font-medium text-ink/65 hover:border-primary/40 hover:text-primary"
          >
            {q.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={note}
        maxLength={MAX_DISCOUNT_NOTE}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Why (optional) — e.g. call kept dropping"
        className="mt-2.5 w-full rounded-lg border border-ink/12 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-primary/40"
      />

      {/* What it means for all three sides. */}
      <div className="mt-3 grid gap-2 rounded-lg bg-bg/60 p-3 text-xs sm:grid-cols-3">
        <p className="text-ink/60">
          Client pays <strong className="text-ink">{formatMoney(preview.collected)}</strong>
          {draft && <span className="text-ink/40"> instead of {formatMoney(preview.billed)}</span>}
        </p>
        <p className="text-ink/60">
          Lawyer gets <strong className="text-ink">{formatMoney(preview.earning)}</strong>
          {preview.fromAdvocate > 0 && (
            <span className="text-amber-600"> · {formatMoney(preview.fromAdvocate)} less</span>
          )}
        </p>
        <p className="text-ink/60">
          We keep <strong className="text-ink">{formatMoney(preview.commission)}</strong>
        </p>
      </div>

      <p className="mt-2 text-[11px] text-ink/45">
        {preview.fromAdvocate > 0 ? (
          <>
            Bigger than our {COMMISSION_LABEL} commission, so the rest comes out of the
            lawyer&rsquo;s share. Up to {COMMISSION_LABEL} off costs them nothing.
          </>
        ) : (
          <>Paid for out of our {COMMISSION_LABEL} commission — the lawyer is paid in full.</>
        )}{' '}
        Applied when the session ends; the bill keeps running until then.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={!draft || tooBig || busy}
          onClick={() => onSave({ kind, value: Number(value), note })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {s.discount ? 'Update discount' : 'Apply discount'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-ink/12 px-3 py-1.5 text-xs font-semibold text-ink/70"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * The same controls for a single session, on its own detail page.
 *
 * Renders nothing once the session is over: there is no bill left to discount
 * and nothing left to end, and a dead set of buttons on a finished session
 * invites an admin to try.
 *
 * @param {object} props
 * @param {object} props.session    one row in the live shape
 * @param {number} props.serverNow  the server's clock when it was read
 */
export function LiveSessionCard({ session, serverNow = Date.now() }) {
  const [row, setRow] = useState(session);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');
  const skew = useMemo(() => serverNow - Date.now(), [serverNow]);
  const router = useRouter();

  useEffect(() => setRow(session), [session]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!['pending', 'active'].includes(row?.status)) return null;

  const act = async (body) => {
    setError('');
    try {
      await post(body);
      router.refresh();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return (
    <div>
      {error && (
        <p className="mb-3 flex items-start gap-2 rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      <SessionRow session={row} serverTime={now + skew} onAct={act} showLink={false} />
    </div>
  );
}
