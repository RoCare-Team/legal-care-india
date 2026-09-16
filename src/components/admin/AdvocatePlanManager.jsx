'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Crown, Sparkles, Shield, CalendarClock, Coins, Loader2, RotateCcw, XCircle, Pencil,
  CreditCard, UserCog, Ban, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { PAID_PLANS } from '@/constants/membershipPlans';

const DURATIONS = [
  { months: 1, label: '1 month' },
  { months: 3, label: '3 months' },
  { months: 6, label: '6 months' },
  { months: 12, label: '1 year' },
];

const PLAN_ICON = { free: Shield, professional: Sparkles, premium: Crown };

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—';

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function post(body) {
  const res = await fetch('/api/admin/advocates/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not update the plan.');
  return data;
}

/**
 * The admin's controls over one lawyer's membership: see what they are on,
 * give or extend a plan by hand, end it, or hand back this month's query
 * credits — and the full history, online payments and manual changes together.
 *
 * @param {object} props
 * @param {string} props.id          the lawyer's _id
 * @param {object} props.membership  from lib/adminMembership `membershipSummary`
 */
export default function AdvocatePlanManager({ id, membership: m }) {
  const router = useRouter();
  const [mode, setMode] = useState(''); // '' | 'set' | 'cancel'
  const [planId, setPlanId] = useState(m.planId !== 'free' ? m.planId : 'professional');
  const [months, setMonths] = useState(12);
  const [custom, setCustom] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [extend, setExtend] = useState(true);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const active = m.planId !== 'free';
  const canExtend = active && m.planId === planId && !custom;
  const Icon = PLAN_ICON[m.planId] || Shield;

  const preview = useMemo(() => {
    if (custom) return endDate ? new Date(`${endDate}T23:59:59+05:30`) : null;
    const base = canExtend && extend && m.expiresAt
      ? new Date(Math.max(new Date(m.expiresAt).getTime(), Date.now()))
      : new Date();
    return addMonths(base, months);
  }, [custom, endDate, canExtend, extend, m.expiresAt, months]);

  const run = async (key, body, success) => {
    setBusy(key);
    setError('');
    setDone('');
    try {
      await post({ id, ...body });
      setDone(success);
      setMode('');
      setNote('');
      setAmount('');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const save = () =>
    run(
      'set',
      {
        action: 'set',
        planId,
        ...(custom ? { endDate } : { months, extend: canExtend && extend }),
        amount: amount ? Number(amount) : 0,
        note,
      },
      `${PAID_PLANS.find((p) => p.id === planId)?.name} plan saved until ${fmt(preview)}.`
    );

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      {(error || done) && (
        <p className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm ${error ? 'bg-rose-500/10 text-rose-700' : 'bg-emerald-500/10 text-emerald-700'}`}>
          {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {error || done}
        </p>
      )}

      {/* ── Where the lawyer stands ─────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-ink/8 p-4">
          <p className="text-xs text-ink/45">Current plan</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-ink">
            <Icon className={`h-5 w-5 ${m.planId === 'premium' ? 'text-amber-500' : m.planId === 'professional' ? 'text-primary' : 'text-ink/35'}`} aria-hidden="true" />
            {m.planName}
          </p>
          <span
            className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              active ? 'bg-emerald-500/10 text-emerald-700' : m.lapsed ? 'bg-rose-500/10 text-rose-600' : 'bg-ink/6 text-ink/50'
            }`}
          >
            {active ? 'Active' : m.lapsed ? `${m.storedPlanName} expired` : 'Free'}
          </span>
        </div>

        <div className="rounded-xl border border-ink/8 p-4">
          <p className="text-xs text-ink/45">{m.lapsed ? 'Expired on' : 'Valid till'}</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-ink">
            <CalendarClock className="h-5 w-5 text-ink/35" aria-hidden="true" />
            {m.expiresAt ? fmt(m.expiresAt) : '—'}
          </p>
          {active && (
            <p className={`mt-1.5 text-xs font-medium ${m.daysLeft <= 7 ? 'text-rose-600' : 'text-ink/50'}`}>
              {m.daysLeft} {m.daysLeft === 1 ? 'day' : 'days'} left
            </p>
          )}
        </div>

        <div className="rounded-xl border border-ink/8 p-4">
          <p className="text-xs text-ink/45">Query credits this month</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-ink">
            <Coins className="h-5 w-5 text-amber-500" aria-hidden="true" />
            {m.credits.hasPlan ? `${m.credits.left} of ${m.credits.allowance} left` : 'None'}
          </p>
          {m.credits.hasPlan && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50">
              {m.credits.resetsAt && <span>Renews {fmt(m.credits.resetsAt)}</span>}
              {m.credits.used > 0 && (
                <button
                  type="button"
                  onClick={() => run('reset', { action: 'reset-credits' }, 'This month’s query credits were given back.')}
                  disabled={Boolean(busy)}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  {busy === 'reset' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  Reset to {m.credits.allowance}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────────────────── */}
      {mode === '' && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setMode('set'); setError(''); setDone(''); }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Pencil className="h-4 w-4" /> {active ? 'Change or extend plan' : 'Give a plan'}
          </button>
          {(active || m.lapsed) && (
            <button
              type="button"
              onClick={() => { setMode('cancel'); setError(''); setDone(''); }}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-500/30 px-4 text-sm font-semibold text-rose-600 hover:bg-rose-500/5"
            >
              <XCircle className="h-4 w-4" /> Cancel plan
            </button>
          )}
        </div>
      )}

      {mode === 'set' && (
        <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/45">Plan</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAID_PLANS.map((p) => {
                const PIcon = PLAN_ICON[p.id];
                const on = planId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${on ? 'border-primary bg-surface ring-2 ring-primary/20' : 'border-ink/10 bg-surface hover:border-primary/40'}`}
                  >
                    <PIcon className={`h-5 w-5 ${p.id === 'premium' ? 'text-amber-500' : 'text-primary'}`} aria-hidden="true" />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-ink">{p.name}</span>
                      <span className="block text-xs text-ink/50">₹{p.monthly}/month · {p.queryCredits} query credits/month</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/45">Duration</p>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.months}
                  type="button"
                  onClick={() => { setMonths(d.months); setCustom(false); }}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${!custom && months === d.months ? 'border-primary bg-primary text-white' : 'border-ink/12 bg-surface text-ink/70 hover:border-primary/40'}`}
                >
                  {d.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustom(true)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${custom ? 'border-primary bg-primary text-white' : 'border-ink/12 bg-surface text-ink/70 hover:border-primary/40'}`}
              >
                Till a date
              </button>
              {custom && (
                <input
                  type="date"
                  min={todayIso}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 rounded-lg border border-ink/15 bg-surface px-2.5 text-sm"
                />
              )}
            </div>
            {canExtend && (
              <label className="mt-3 flex items-center gap-2 text-sm text-ink/70">
                <input type="checkbox" checked={extend} onChange={(e) => setExtend(e.target.checked)} className="h-4 w-4 accent-[#1E3A5F]" />
                Add to the current expiry ({fmt(m.expiresAt)}) instead of starting today
              </label>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/45">Amount received</span>
              <span className="flex h-10 items-center rounded-lg border border-ink/15 bg-surface px-2.5 text-sm">
                ₹
                <input
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 7))}
                  placeholder="0"
                  className="ml-1 w-full bg-transparent outline-none"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/45">Note</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                placeholder="e.g. Paid by UPI, ref 4521… / complimentary launch offer"
                className="h-10 w-full rounded-lg border border-ink/15 bg-surface px-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/8 pt-4">
            <p className="text-sm text-ink/65">
              {preview ? (
                <>
                  <strong className="text-ink">{PAID_PLANS.find((p) => p.id === planId)?.name}</strong> until{' '}
                  <strong className="text-ink">{fmt(preview)}</strong>
                  {planId !== m.planId || !canExtend || !extend ? ' · credits start fresh' : ''}
                </>
              ) : (
                'Pick an end date.'
              )}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode('')} className="h-10 rounded-xl px-4 text-sm font-medium text-ink/60 hover:bg-ink/5">
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={Boolean(busy) || !preview}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {busy === 'set' && <Loader2 className="h-4 w-4 animate-spin" />}
                Save plan
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'cancel' && (
        <div className="space-y-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.04] p-4">
          <p className="text-sm text-ink/75">
            End the <strong>{m.lapsed ? m.storedPlanName : m.planName}</strong> plan now? The lawyer drops to Starter straight away:
            lower search placement, Starter listing limits and no client queries. Nothing is refunded automatically.
          </p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder="Reason (optional)"
            className="h-10 w-full rounded-lg border border-ink/15 bg-surface px-2.5 text-sm outline-none focus:border-rose-400"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMode('')} className="h-10 rounded-xl px-4 text-sm font-medium text-ink/60 hover:bg-ink/5">
              Keep plan
            </button>
            <button
              type="button"
              onClick={() => run('cancel', { action: 'cancel', note }, 'Plan cancelled. The lawyer is on Starter now.')}
              disabled={Boolean(busy)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {busy === 'cancel' && <Loader2 className="h-4 w-4 animate-spin" />}
              Yes, cancel plan
            </button>
          </div>
        </div>
      )}

      {/* ── History ─────────────────────────────────────────────── */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/45">Plan history</p>
        {m.history.length === 0 ? (
          <p className="rounded-xl bg-ink/[0.03] py-5 text-center text-sm text-ink/45">No plan purchased or set yet.</p>
        ) : (
          <ul className="divide-y divide-ink/6 rounded-xl border border-ink/8">
            {m.history.map((h, i) => {
              const cancel = h.action === 'cancel';
              const online = h.source === 'razorpay';
              const HIcon = cancel ? Ban : online ? CreditCard : UserCog;
              return (
                <li key={h.id || i} className="flex flex-wrap items-start gap-3 px-3.5 py-3">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${cancel ? 'bg-rose-500/10 text-rose-600' : online ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'}`}>
                    <HIcon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {cancel ? `${h.planName} cancelled` : `${h.planName} · ${h.months} ${h.months === 1 ? 'month' : 'months'}`}
                      <span className={`ml-2 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${cancel ? 'bg-rose-500/10 text-rose-600' : online ? 'bg-emerald-500/10 text-emerald-700' : 'bg-blue-500/10 text-blue-600'}`}>
                        {cancel ? 'By admin' : online ? 'Paid online' : 'Set by admin'}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink/50">
                      {cancel ? `On ${fmt(h.startedAt)}` : `${fmt(h.startedAt)} → ${fmt(h.expiresAt)}`}
                      {h.grantedBy ? ` · ${h.grantedBy}` : ''}
                      {h.paymentId ? ` · ${h.paymentId}` : ''}
                    </p>
                    {h.note && <p className="mt-0.5 text-xs italic text-ink/55">“{h.note}”</p>}
                  </div>
                  {!cancel && (
                    <span className="text-sm font-semibold text-ink">
                      {h.total > 0 ? `₹${h.total.toLocaleString('en-IN')}` : <span className="text-ink/40">No charge</span>}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
