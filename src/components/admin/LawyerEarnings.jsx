'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Banknote, AlertTriangle, CheckCircle2, Clock, Landmark } from 'lucide-react';
import { formatMoney } from '@/constants/payouts';
import { CopyValue } from './PayoutRequests';

/** One small labelled figure in a lawyer's row. */
function Figure({ label, value, strong = false, tone = 'text-ink' }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">{label}</p>
      <p className={`truncate tabular-nums ${strong ? 'font-display text-lg font-bold' : 'text-sm font-semibold'} ${tone}`}>
        {value}
      </p>
    </div>
  );
}

/**
 * Paying one lawyer: their bank details to copy into the bank's transfer
 * screen, the amount (their whole balance unless changed), and the UTR once
 * the transfer has gone. Without a UTR the payout is only queued under "To
 * pay" — for when the transfer will be made later.
 */
function PayPanel({ lawyer, minPayout, onClose }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(lawyer.balance));
  const [utr, setUtr] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const value = Number(amount);
  const validAmount = Number.isFinite(value) && value >= minPayout && value <= lawyer.balance;

  const submit = async (withUtr) => {
    setBusy(withUtr ? 'paid' : 'queue');
    setError('');
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advocateId: lawyer.id, amount: value, utr: withUtr ? utr.trim() : '' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create the payout.');
      onClose();
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const b = lawyer.bank;
  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <p className="mb-3 text-sm font-semibold text-ink">
        1. Transfer to this account from the company bank (NEFT / IMPS)
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <CopyValue label="Account holder" value={b.holderName} />
        <CopyValue label="Account number" value={b.accountNumber || `••${b.accountLast4}`} />
        <CopyValue label="IFSC" value={b.ifsc} />
        {b.pan && <CopyValue label="PAN" value={b.pan} />}
        <div className="flex items-center gap-2 rounded-lg bg-muted/70 px-3 py-2">
          <Landmark className="h-4 w-4 text-ink/40" aria-hidden="true" />
          <p className="truncate text-sm capitalize text-ink">
            {b.bankName || 'Bank'} · {b.accountType}
          </p>
        </div>
      </div>

      <p className="mb-2 mt-4 text-sm font-semibold text-ink">2. Amount and the bank&apos;s reference</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative sm:w-44">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/45">₹</span>
          <input
            type="number"
            min={minPayout}
            max={lawyer.balance}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Amount"
            className="h-10 w-full rounded-xl border border-ink/15 bg-surface pl-7 pr-3 text-sm tabular-nums outline-none focus:border-primary"
          />
        </label>
        <input
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          placeholder="UTR / transaction reference from the bank"
          className="h-10 flex-1 rounded-xl border border-ink/15 bg-surface px-3 text-sm outline-none focus:border-primary"
        />
      </div>
      {!validAmount && (
        <p className="mt-1.5 text-xs text-red-600">
          Between {formatMoney(minPayout)} and {formatMoney(lawyer.balance)}.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={Boolean(busy) || !validAmount || utr.trim().length < 6}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy === 'paid' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Transferred — mark paid
        </button>
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={Boolean(busy) || !validAmount}
          title="Debit the balance now and list it under To pay, to transfer later"
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink/15 bg-surface px-4 py-2 text-sm font-semibold text-ink/70 hover:border-primary/40 hover:text-primary disabled:opacity-50"
        >
          {busy === 'queue' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
          Pay later — add to &quot;To pay&quot;
        </button>
        <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-medium text-ink/60 hover:bg-ink/5">
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function LawyerRow({ lawyer: l, minPayout }) {
  const [paying, setPaying] = useState(false);
  const payable = l.balance >= minPayout;

  let action;
  if (l.hasOpenPayout) {
    action = (
      <Link
        href="/admin/payouts?status=requested"
        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700"
      >
        <Clock className="h-3.5 w-3.5" /> {formatMoney(l.processing)} waiting in To pay
      </Link>
    );
  } else if (!payable) {
    action = (
      <span className="text-xs text-ink/45">
        {l.balance > 0 ? `Below the ${formatMoney(minPayout)} minimum` : 'Nothing owed'}
      </span>
    );
  } else if (!l.bank) {
    action = (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600">
        <AlertTriangle className="h-3.5 w-3.5" /> No bank account added
      </span>
    );
  } else {
    action = (
      <button
        type="button"
        onClick={() => setPaying((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        <Banknote className="h-4 w-4" /> Pay {formatMoney(l.balance)}
      </button>
    );
  }

  return (
    <li className={`rounded-2xl border bg-surface p-4 shadow-card sm:p-5 ${payable && !l.hasOpenPayout ? 'border-emerald-200' : 'border-ink/8'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/admin/advocates/${l.id}`} className="font-semibold text-ink hover:text-primary hover:underline">
            {l.name}
          </Link>
          <p className="text-xs text-ink/45">
            {[l.legalCareId, l.city, l.phone].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex items-center">{action}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Figure label={`Clients paid · ${l.sessions}`} value={formatMoney(l.gross)} />
        <Figure label="JusticeLand commission" value={`− ${formatMoney(l.commission)}`} tone="text-ink/60" />
        <Figure label="Lawyer's share" value={formatMoney(l.earned)} />
        <Figure label={`Paid out · ${l.paidCount}`} value={formatMoney(l.paidOut)} tone="text-emerald-700" />
        <Figure label="Processing" value={formatMoney(l.processing)} tone={l.processing > 0 ? 'text-amber-700' : 'text-ink/40'} />
        <Figure label="Balance owed" value={formatMoney(l.balance)} strong tone={l.balance > 0 ? 'text-ink' : 'text-ink/40'} />
      </div>

      {paying && l.bank && <PayPanel lawyer={l} minPayout={minPayout} onClose={() => setPaying(false)} />}
    </li>
  );
}

/**
 * LawyerEarnings — every lawyer who has earned something: how it adds up
 * (clients paid → commission → their share → paid out → still owed), and a
 * Pay button for whoever is owed, without waiting for them to request it.
 */
export default function LawyerEarnings({ lawyers, minPayout }) {
  const [q, setQ] = useState('');
  const [view, setView] = useState('owed');

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return lawyers.filter((l) => {
      if (view === 'owed' && l.balance <= 0 && l.processing <= 0) return false;
      if (view === 'ready' && !(l.balance >= minPayout && l.bank && !l.hasOpenPayout)) return false;
      if (!term) return true;
      return [l.name, l.legalCareId, l.phone, l.city].some((v) => String(v || '').toLowerCase().includes(term));
    });
  }, [lawyers, q, view, minPayout]);

  const chip = (key, label) => (
    <button
      key={key}
      type="button"
      onClick={() => setView(key)}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
        view === key ? 'border-primary bg-primary text-white' : 'border-ink/10 bg-surface text-ink/65 hover:border-primary/40'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {chip('owed', 'Owed money')}
        {chip('ready', 'Ready to pay')}
        {chip('all', 'All lawyers')}
        <label className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, ID, phone, city…"
            className="h-10 w-full rounded-xl border border-ink/12 bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 bg-surface px-6 py-16 text-center text-sm text-ink/55">
          {lawyers.length === 0
            ? 'No lawyer has earned anything yet. Earnings appear here as paid consultations finish.'
            : view === 'owed'
              ? 'No lawyer is owed money right now. Switch to "All lawyers" to see everyone who has earned.'
              : 'Nobody matches.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((l) => (
            <LawyerRow key={l.id} lawyer={l} minPayout={minPayout} />
          ))}
        </ul>
      )}
    </div>
  );
}
