'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Check, Loader2, Landmark, CheckCircle2, XCircle } from 'lucide-react';
import { PAYOUT_STATUS, formatMoney } from '@/constants/payouts';

const dateTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
});
const when = (v) => (v ? dateTime.format(new Date(v)) : '—');

function CopyValue({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/70 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">{label}</p>
        <p className="truncate font-mono text-sm text-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked — the value is on screen anyway */
          }
        }}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink/50 hover:bg-ink/5 hover:text-ink"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PayoutCard({ payout: p }) {
  const router = useRouter();
  const [mode, setMode] = useState(null); // 'paid' | 'reject'
  const [utr, setUtr] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const status = PAYOUT_STATUS[p.status] || PAYOUT_STATUS.requested;
  const open = p.status === 'requested';

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/payouts/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'paid' ? { action: 'paid', utr } : { action: 'reject', reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update this payout.');
      setMode(null);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`rounded-2xl border bg-surface p-4 shadow-card sm:p-5 ${open ? 'border-amber-300/60' : 'border-ink/8'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/admin/advocates/${p.advocateId}`} className="font-semibold text-ink hover:text-primary hover:underline">
            {p.advocateName || 'Lawyer'}
          </Link>
          <p className="text-xs text-ink/45">
            {p.legalCareId} · Requested {when(p.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold text-ink">{formatMoney(p.amount)}</p>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <CopyValue label="Account holder" value={p.bank.holderName} />
        <CopyValue label="Account number" value={p.bank.accountNumber || `••${p.bank.accountLast4}`} />
        <CopyValue label="IFSC" value={p.bank.ifsc} />
        <div className="flex items-center gap-2 rounded-lg bg-muted/70 px-3 py-2">
          <Landmark className="h-4 w-4 text-ink/40" aria-hidden="true" />
          <p className="truncate text-sm capitalize text-ink">
            {p.bank.bankName || 'Bank'} · {p.bank.accountType}
          </p>
        </div>
      </div>

      {p.status === 'paid' && (
        <p className="mt-3 text-sm text-emerald-700">
          UTR <span className="font-mono">{p.utr}</span> · marked paid {when(p.processedAt)} by {p.processedBy}
        </p>
      )}
      {(p.status === 'rejected' || p.status === 'cancelled') && (
        <p className="mt-3 text-sm text-ink/55">
          {p.status === 'rejected' ? `Rejected by ${p.processedBy}: ${p.adminNote}` : 'Cancelled by the lawyer'} · {when(p.processedAt)} · refunded to their balance
        </p>
      )}

      {open && (
        <div className="mt-4 border-t border-ink/8 pt-4">
          {mode === null ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setMode('paid')} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Mark as paid
              </button>
              <button type="button" onClick={() => setMode('reject')} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {mode === 'paid' ? (
                <input
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="Bank transfer reference (UTR)"
                  className="h-10 flex-1 rounded-xl border border-ink/15 px-3 text-sm outline-none focus:border-primary"
                  autoFocus
                />
              ) : (
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (the lawyer sees this)"
                  className="h-10 flex-1 rounded-xl border border-ink/15 px-3 text-sm outline-none focus:border-primary"
                  autoFocus
                />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy || (mode === 'paid' ? utr.trim().length < 6 : !reason.trim())}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                    mode === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === 'paid' ? 'Confirm paid' : 'Reject & refund'}
                </button>
                <button type="button" onClick={() => { setMode(null); setError(''); }} className="rounded-xl px-3 py-2 text-sm font-medium text-ink/60 hover:bg-ink/5">
                  Cancel
                </button>
              </div>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </li>
  );
}

/** The admin's payout queue. */
export default function PayoutRequests({ payouts }) {
  if (payouts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 bg-surface px-6 py-16 text-center text-sm text-ink/55">
        No payouts here.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {payouts.map((p) => (
        <PayoutCard key={p.id} payout={p} />
      ))}
    </ul>
  );
}
