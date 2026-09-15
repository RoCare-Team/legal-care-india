'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Wallet, Landmark, Plus, X, Loader2, CheckCircle2, Clock, Trash2, Star, ArrowDownToLine,
  IndianRupee, Percent, BadgeIndianRupee, Send, ShieldCheck, AlertCircle, Receipt,
} from 'lucide-react';
import { COMMISSION_LABEL, IFSC_PATTERN, ACCOUNT_NUMBER_PATTERN, PAYOUT_STATUS, formatMoney } from '@/constants/payouts';

const dateTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
});
const when = (v) => (v ? dateTime.format(new Date(v)) : '—');

async function send(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function Modal({ title, icon: Icon, onClose, children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-ink/8 bg-surface px-5 py-4">
          <h3 className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            {title}
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/80">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink/45">{hint}</span>
      ) : null}
    </label>
  );
}

const inputClass =
  'h-11 w-full rounded-xl border border-ink/12 bg-surface px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-primary focus:ring-2 focus:ring-primary/15';

function ErrorNote({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

// ── Add bank account ─────────────────────────────────────────────────────────

function AddBankAccountModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ holderName: '', accountNumber: '', confirm: '', ifsc: '', bankName: '', accountType: 'savings' });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: k === 'ifsc' ? e.target.value.toUpperCase() : e.target.value }));

  const errors = {
    holderName: form.holderName.trim().length < 3 ? 'Enter the name exactly as your bank has it.' : '',
    accountNumber: !ACCOUNT_NUMBER_PATTERN.test(form.accountNumber.replace(/\s+/g, '')) ? 'Account number is 9 to 18 digits.' : '',
    confirm: form.confirm.replace(/\s+/g, '') !== form.accountNumber.replace(/\s+/g, '') ? 'Account numbers do not match.' : '',
    ifsc: !IFSC_PATTERN.test(form.ifsc.trim()) ? '11 characters, like HDFC0001234.' : '',
  };
  const valid = !Object.values(errors).some(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    setError('');
    try {
      await send('/api/dashboard/bank-accounts', 'POST', {
        holderName: form.holderName,
        accountNumber: form.accountNumber.replace(/\s+/g, ''),
        ifsc: form.ifsc.trim(),
        bankName: form.bankName,
        accountType: form.accountType,
      });
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const show = (k) => (touched ? errors[k] : '');

  return (
    <Modal title="Add bank account" icon={Landmark} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Account holder name" error={show('holderName')}>
          <input className={inputClass} value={form.holderName} onChange={set('holderName')} autoComplete="name" placeholder="As printed on your passbook" />
        </Field>
        <Field label="Account number" error={show('accountNumber')}>
          <input className={inputClass} value={form.accountNumber} onChange={set('accountNumber')} inputMode="numeric" autoComplete="off" placeholder="e.g. 50100123456789" />
        </Field>
        <Field label="Confirm account number" error={show('confirm')}>
          <input className={inputClass} value={form.confirm} onChange={set('confirm')} inputMode="numeric" autoComplete="off" onPaste={(e) => e.preventDefault()} placeholder="Type it again" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="IFSC code" error={show('ifsc')}>
            <input className={`${inputClass} uppercase`} value={form.ifsc} onChange={set('ifsc')} maxLength={11} autoComplete="off" placeholder="HDFC0001234" />
          </Field>
          <Field label="Bank name">
            <input className={inputClass} value={form.bankName} onChange={set('bankName')} placeholder="HDFC Bank" />
          </Field>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink/80">Account type</span>
          <div className="grid grid-cols-2 gap-2">
            {['savings', 'current'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((f) => ({ ...f, accountType: t }))}
                className={`h-10 rounded-xl border text-sm font-semibold capitalize transition-colors ${
                  form.accountType === t ? 'border-primary bg-primary/[0.06] text-primary' : 'border-ink/12 text-ink/65 hover:border-ink/25'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <p className="flex items-start gap-2 rounded-xl bg-muted/70 px-3 py-2.5 text-xs text-ink/60">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          Your account number is stored encrypted. Only the last four digits are shown on this page.
        </p>
        <ErrorNote message={error} />
        <button type="submit" disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-brand transition-colors hover:bg-primary-dark disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Save bank account
        </button>
      </form>
    </Modal>
  );
}

// ── Request payout ───────────────────────────────────────────────────────────

function RequestPayoutModal({ balance, minPayout, accounts, onClose, onDone }) {
  const primary = accounts.find((a) => a.isPrimary) || accounts[0];
  const [amount, setAmount] = useState(String(Math.floor(balance * 100) / 100));
  const [accountId, setAccountId] = useState(primary?.id || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const value = Number(amount);
  const problem =
    !Number.isFinite(value) || value <= 0
      ? 'Enter an amount.'
      : value < minPayout
        ? `The smallest payout is ${formatMoney(minPayout)}.`
        : value > balance
          ? `You can withdraw up to ${formatMoney(balance)}.`
          : '';

  const submit = async (e) => {
    e.preventDefault();
    if (problem || !accountId) return;
    setBusy(true);
    setError('');
    try {
      await send('/api/dashboard/payouts', 'POST', { amount: value, bankAccountId: accountId });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Request payout" icon={Send} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-4 text-white">
          <p className="text-xs text-white/70">Available to withdraw</p>
          <p className="font-display text-2xl font-semibold">{formatMoney(balance)}</p>
          <p className="mt-1 text-[11px] text-white/60">Already after JusticeLand’s {COMMISSION_LABEL} commission.</p>
        </div>

        <Field label="Amount" error={amount ? problem : ''}>
          <div className="relative">
            <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
            <input className={`${inputClass} pl-9 text-base font-semibold`} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" />
            <button type="button" onClick={() => setAmount(String(Math.floor(balance * 100) / 100))} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/15">
              Full balance
            </button>
          </div>
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink/80">Send to</span>
          <div className="space-y-2">
            {accounts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccountId(a.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  accountId === a.id ? 'border-primary bg-primary/[0.05] ring-1 ring-primary/20' : 'border-ink/10 hover:border-ink/25'
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Landmark className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-semibold text-ink">{a.bankName || 'Bank account'} ••{a.accountLast4}</span>
                  <span className="block truncate text-xs text-ink/50">{a.holderName} · {a.ifsc}</span>
                </span>
                {accountId === a.id && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-ink/50">
          The amount leaves your balance now. Our team transfers it to this account and you’ll see the bank
          reference (UTR) here once it’s paid. You can cancel while it’s still processing.
        </p>
        <ErrorNote message={error} />
        <button type="submit" disabled={busy || Boolean(problem) || !accountId} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
          Request {value > 0 ? formatMoney(value) : 'payout'}
        </button>
      </form>
    </Modal>
  );
}

// ── Page body ────────────────────────────────────────────────────────────────

function Tile({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-xl font-semibold text-ink sm:text-2xl">{value}</p>
      <p className="text-xs font-medium text-ink/60">{label}</p>
      {hint && <p className="mt-0.5 text-[11px] text-ink/40">{hint}</p>}
    </div>
  );
}

/**
 * The lawyer's payouts: what they can withdraw and how it was worked out, the
 * request itself, every payout so far, and the bank accounts they go to.
 *
 * @param {object} props
 * @param {object} props.data  from getLawyerPayoutData
 */
export default function PayoutsWorkspace({ data }) {
  const router = useRouter();
  const [modal, setModal] = useState(null); // 'payout' | 'bank' | null
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { balance, summary, payouts, bankAccounts, minPayout, maxBankAccounts, openPayoutId } = data;
  const openPayout = useMemo(() => payouts.find((p) => p.id === openPayoutId), [payouts, openPayoutId]);
  const canRequest = balance >= minPayout && bankAccounts.length > 0 && !openPayoutId;

  const done = (text) => {
    setModal(null);
    setMessage(text);
    setError('');
    router.refresh();
  };

  const act = async (key, fn, success) => {
    setBusyId(key);
    setError('');
    setMessage('');
    try {
      await fn();
      setMessage(success);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {(message || error) && (
        <p className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
          {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          {error || message}
        </p>
      )}

      {/* Withdrawable balance */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-secondary p-5 text-white shadow-brand sm:p-7">
        <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm text-white/70">
              <Wallet className="h-4 w-4 text-accent" aria-hidden="true" /> Withdrawable balance
            </p>
            <p className="mt-1 font-display text-4xl font-semibold">{formatMoney(balance)}</p>
            <p className="mt-1 text-xs text-white/60">After JusticeLand’s {COMMISSION_LABEL} commission · minimum payout {formatMoney(minPayout)}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => setModal('payout')}
              disabled={!canRequest}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-b from-[#E7C766] via-accent to-[#BC9A2E] px-6 text-sm font-semibold text-[#241B02] shadow-gold transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
            >
              <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              Request payout
            </button>
            <p className="text-[11px] text-white/60">
              {openPayoutId
                ? 'A payout is already processing.'
                : bankAccounts.length === 0
                  ? 'Add a bank account first.'
                  : balance < minPayout
                    ? `Withdraw once you have ${formatMoney(minPayout)}.`
                    : 'Sent to your bank by our team.'}
            </p>
          </div>
        </div>
        {openPayout && (
          <div className="relative mt-5 flex flex-col gap-3 rounded-2xl bg-white/10 p-3.5 sm:flex-row sm:items-center">
            <Clock className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
            <p className="flex-1 text-sm">
              <span className="font-semibold">{formatMoney(openPayout.amount)}</span> is on its way to{' '}
              {openPayout.bank.bankName || 'your bank'} ••{openPayout.bank.accountLast4} · requested {when(openPayout.createdAt)}
            </p>
            <button
              type="button"
              disabled={busyId === openPayout.id}
              onClick={() => act(openPayout.id, () => send(`/api/dashboard/payouts/${openPayout.id}`, 'PATCH', { action: 'cancel' }), 'Payout cancelled. The amount is back in your balance.')}
              className="inline-flex items-center gap-1.5 self-start rounded-lg border border-white/25 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 disabled:opacity-60 sm:self-center"
            >
              {busyId === openPayout.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Cancel request
            </button>
          </div>
        )}
      </div>

      {/* Lifetime figures */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Tile icon={IndianRupee} label="Clients paid" value={formatMoney(summary.gross)} hint={`${summary.sessions} paid sessions`} tone="bg-primary/10 text-primary" />
        <Tile icon={Percent} label={`JusticeLand commission (${COMMISSION_LABEL})`} value={`−${formatMoney(summary.commission)}`} tone="bg-red-50 text-red-500" />
        <Tile icon={BadgeIndianRupee} label="Your earnings" value={formatMoney(summary.earning)} hint="After commission" tone="bg-emerald-50 text-emerald-600" />
        <Tile icon={CheckCircle2} label="Paid out" value={formatMoney(summary.paidOut)} tone="bg-blue-500/10 text-blue-600" />
        <Tile icon={Clock} label="Processing" value={formatMoney(summary.processing)} tone="bg-amber-500/10 text-amber-700" />
      </div>

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        {/* How it is worked out */}
        <section className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
            <Receipt className="h-5 w-5 text-primary" aria-hidden="true" />
            How your payout is calculated
          </h2>
          <dl className="mt-4 divide-y divide-ink/8 rounded-xl border border-ink/8 text-sm">
            {[
              ['Total paid by clients', formatMoney(summary.gross), 'text-ink'],
              [`JusticeLand commission (${COMMISSION_LABEL})`, `− ${formatMoney(summary.commission)}`, 'text-red-600'],
              ['Your earnings', formatMoney(summary.earning), 'font-semibold text-ink'],
              ['Already paid out', `− ${formatMoney(summary.paidOut)}`, 'text-ink/70'],
              ['Processing', `− ${formatMoney(summary.processing)}`, 'text-ink/70'],
            ].map(([label, value, tone]) => (
              <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="text-ink/60">{label}</dt>
                <dd className={`whitespace-nowrap ${tone}`}>{value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 bg-emerald-50/70 px-4 py-3.5">
              <dt className="font-semibold text-emerald-800">Withdrawable balance</dt>
              <dd className="font-display text-lg font-semibold text-emerald-700">{formatMoney(balance)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-ink/45">
            Every paid consultation is split when it ends: JusticeLand keeps {COMMISSION_LABEL} and the rest is added to your
            balance. Balances from before commission started were adjusted once at the same rate.
          </p>
        </section>

        {/* Bank accounts */}
        <section className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
              <Landmark className="h-5 w-5 text-primary" aria-hidden="true" />
              Bank accounts
            </h2>
            {bankAccounts.length < maxBankAccounts && (
              <button type="button" onClick={() => setModal('bank')} className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/15">
                <Plus className="h-4 w-4" aria-hidden="true" /> Add
              </button>
            )}
          </div>

          {bankAccounts.length === 0 ? (
            <button type="button" onClick={() => setModal('bank')} className="mt-4 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-ink/20 px-4 py-8 text-center hover:border-primary/40 hover:bg-primary/[0.02]">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                <Plus className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-ink/75">Add your bank account</span>
              <span className="text-xs text-ink/45">Payouts are sent here.</span>
            </button>
          ) : (
            <ul className="mt-4 space-y-3">
              {bankAccounts.map((a) => (
                <li key={a.id} className={`rounded-xl border p-3.5 ${a.isPrimary ? 'border-primary/30 bg-primary/[0.03]' : 'border-ink/10'}`}>
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Landmark className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                        {a.bankName || 'Bank account'} ••{a.accountLast4}
                        {a.isPrimary && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Primary</span>
                        )}
                      </p>
                      <p className="mt-1 truncate text-xs text-ink/55">{a.holderName}</p>
                      <p className="text-xs capitalize text-ink/45">{a.ifsc} · {a.accountType}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-ink/8 pt-3">
                    {!a.isPrimary && (
                      <button
                        type="button"
                        disabled={Boolean(busyId)}
                        onClick={() => act(`p-${a.id}`, () => send(`/api/dashboard/bank-accounts/${a.id}`, 'PATCH', { action: 'primary' }), 'Primary account updated.')}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                      >
                        {busyId === `p-${a.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" />}
                        Make primary
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={Boolean(busyId)}
                      onClick={() => {
                        if (window.confirm(`Remove ${a.bankName || 'this account'} ••${a.accountLast4}?`)) {
                          act(`d-${a.id}`, () => send(`/api/dashboard/bank-accounts/${a.id}`, 'DELETE'), 'Bank account removed.');
                        }
                      }}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyId === `d-${a.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* History */}
      <section className="rounded-2xl border border-ink/8 bg-surface shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-ink/8 px-5 py-4 sm:px-6">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
            <ArrowDownToLine className="h-5 w-5 text-primary" aria-hidden="true" />
            Payout history
          </h2>
          <span className="text-xs text-ink/45">{payouts.length} total</span>
        </div>
        {payouts.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-ink/50">No payouts yet. Requested payouts and their bank references appear here.</p>
        ) : (
          <ul className="divide-y divide-ink/8">
            {payouts.map((p) => {
              const s = PAYOUT_STATUS[p.status] || PAYOUT_STATUS.requested;
              return (
                <li key={p.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${p.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-ink/5 text-ink/50'}`}>
                      {p.status === 'paid' ? <CheckCircle2 className="h-5 w-5" /> : p.status === 'requested' ? <Clock className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 leading-tight">
                      <p className="text-sm font-semibold text-ink">
                        {formatMoney(p.amount)}
                        <span className={`ml-2 rounded-full px-2 py-0.5 align-middle text-[11px] font-semibold ${s.tone}`}>{s.label}</span>
                      </p>
                      <p className="mt-1 truncate text-xs text-ink/50">
                        {p.bank.bankName || 'Bank'} ••{p.bank.accountLast4} · Requested {when(p.createdAt)}
                      </p>
                      {p.status === 'paid' && (
                        <p className="mt-0.5 text-xs text-emerald-700">UTR {p.utr} · Paid {when(p.processedAt)}</p>
                      )}
                      {p.adminNote && p.status !== 'paid' && <p className="mt-0.5 text-xs text-red-600">{p.adminNote}</p>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {modal === 'bank' && <AddBankAccountModal onClose={() => setModal(null)} onAdded={() => done('Bank account added.')} />}
      {modal === 'payout' && (
        <RequestPayoutModal
          balance={balance}
          minPayout={minPayout}
          accounts={bankAccounts}
          onClose={() => setModal(null)}
          onDone={() => done('Payout requested. It is now processing.')}
        />
      )}
    </div>
  );
}
