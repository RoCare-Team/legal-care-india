'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Wallet, X, Loader2, Plus, Minus, CircleAlert, Check } from 'lucide-react';

/**
 * WalletAdjust — the admin's way of putting money into a client's wallet, or
 * taking a wrong entry back out.
 *
 * Deliberately a small, deliberate form rather than an inline field: this is
 * real money the client can spend on a consultation the moment it lands, so it
 * asks for the amount, what it is for, and a confirmation of which way it
 * goes. The reason is written into the same ledger the client reads.
 *
 * The server does the arithmetic and refuses a deduction the balance does not
 * cover — this only shows what it said.
 *
 * @param {object} props
 * @param {string} props.userId
 * @param {string} props.name           whose wallet, shown in the dialog
 * @param {number} props.balance        current balance, for the header and the cap
 * @param {'button'|'icon'} [props.variant='button']
 */
export default function WalletAdjust({ userId, name, balance = 0, variant = 'button' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Adjust ${name || 'this client'}'s wallet`}
        aria-label={`Adjust ${name || 'this client'}'s wallet`}
        className={
          variant === 'icon'
            ? 'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-500/10'
            : 'inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.08] px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-500 hover:bg-emerald-500 hover:text-white'
        }
      >
        <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
        {variant === 'icon' ? null : 'Wallet'}
      </button>

      {mounted && open && (
        <AdjustDialog
          userId={userId}
          name={name}
          balance={balance}
          onClose={() => setOpen(false)}
          onDone={() => router.refresh()}
        />
      )}
    </>
  );
}

function AdjustDialog({ userId, name, balance, onClose, onDone }) {
  const [action, setAction] = useState('credit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', onKey);
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      body.style.overflow = prev;
    };
  }, [onClose, busy]);

  const value = Math.round(Number(amount) || 0);
  const valid = value > 0 && (action === 'credit' || value <= balance);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, action, amount: value, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not update the wallet.');
        setBusy(false);
        return;
      }
      setDone(data.walletBalance);
      setBusy(false);
      onDone?.();
    } catch {
      setError('Could not reach the server. Please try again.');
      setBusy(false);
    }
  };

  const tab = (mine) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold transition-colors ${
      action === mine
        ? mine === 'credit'
          ? 'bg-emerald-500 text-white shadow-sm'
          : 'bg-rose-500 text-white shadow-sm'
        : 'text-ink/55 hover:text-ink'
    }`;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Wallet for ${name || 'client'}`}
    >
      <div className="absolute inset-0 bg-ink/60" onClick={() => !busy && onClose()} aria-hidden="true" />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-ink/8 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink/45">Wallet</p>
            <h2 className="mt-0.5 truncate font-display text-[17px] font-bold text-ink">
              {name || 'Client'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/50 hover:bg-ink/5 disabled:opacity-40"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {done !== null ? (
            <div className="py-3 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
                <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
              </span>
              <p className="mt-3 text-[14px] font-semibold text-ink">Wallet updated</p>
              <p className="mt-1 text-[13px] text-ink/60">
                New balance: ₹{Number(done).toLocaleString('en-IN')}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="flex items-center justify-between rounded-xl bg-muted/60 px-3.5 py-2.5 text-[13px]">
                <span className="text-ink/55">Current balance</span>
                <span className="font-display text-[16px] font-bold text-ink">
                  ₹{Number(balance).toLocaleString('en-IN')}
                </span>
              </p>

              <div className="mt-3 flex gap-1 rounded-xl border border-ink/10 bg-muted/40 p-1">
                <button type="button" onClick={() => setAction('credit')} className={tab('credit')}>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add money
                </button>
                <button type="button" onClick={() => setAction('debit')} className={tab('debit')}>
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  Deduct
                </button>
              </div>

              <label htmlFor="wallet-amount" className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-ink/45">
                Amount
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink/50">
                  ₹
                </span>
                <input
                  id="wallet-amount"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  placeholder="0"
                  autoFocus
                  className="h-11 w-full rounded-xl border border-ink/12 bg-surface pl-8 pr-3 text-sm font-semibold text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
              {action === 'debit' && value > balance && (
                <p className="mt-1.5 text-[12.5px] text-rose-600">
                  More than the balance (₹{Number(balance).toLocaleString('en-IN')}).
                </p>
              )}

              <label htmlFor="wallet-note" className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-ink/45">
                Reason <span className="font-medium normal-case text-ink/35">(shown to the client)</span>
              </label>
              <input
                id="wallet-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={action === 'credit' ? 'e.g. Refund for call that did not connect' : 'e.g. Reversing a duplicate credit'}
                className="mt-1.5 h-11 w-full rounded-xl border border-ink/12 bg-surface px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-primary focus:ring-2 focus:ring-primary/15"
              />

              {error && (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={busy || !valid}
                className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40 ${
                  action === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : action === 'credit' ? (
                  `Add ₹${(value || 0).toLocaleString('en-IN')}`
                ) : (
                  `Deduct ₹${(value || 0).toLocaleString('en-IN')}`
                )}
              </button>
              <p className="mt-2 text-center text-[11.5px] text-ink/45">
                Goes into the client&apos;s wallet ledger straight away.
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
