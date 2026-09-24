'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Inbox, HandHeart, CheckCircle2, Loader2, MapPin, Clock, Phone, Mail, MessageSquareText,
  AlertCircle, Undo2, Scale, X, Coins, Lock, Crown,
} from 'lucide-react';
import { MEMBERSHIP_PLANS } from '@/constants/membershipPlans';

const TABS = [
  { key: 'open', label: 'Open queries', icon: Inbox },
  { key: 'mine', label: 'My queries', icon: HandHeart },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2 },
];

async function act(id, body) {
  const res = await fetch(`/api/dashboard/queries/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Please try again.');
    err.code = data.code;
    throw err;
  }
  return data;
}

function Meta({ query }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink/50">
      {query.category && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.07] px-2.5 py-1 font-semibold text-primary">
          <Scale className="h-3 w-3" aria-hidden="true" />
          {query.category}
        </span>
      )}
      {query.city && (
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {query.city}
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {query.age}
      </span>
    </div>
  );
}

/** The problem, and who asked — masked until this lawyer takes it. */
function QueryCard({ query, tab, busy, canClaim, onClaim, onRelease, onResolve }) {
  const [note, setNote] = useState('');
  const [closing, setClosing] = useState(false);

  return (
    <article className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 font-display text-base font-semibold text-primary">
          {(query.name || query.askedBy || 'C').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
            {tab === 'open' ? query.askedBy : query.name}
            {tab === 'open' && (
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/50">
                Contact hidden
              </span>
            )}
          </p>
          <Meta query={query} />
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-muted/60 p-3.5 text-sm leading-relaxed text-ink/80">
        {query.message}
      </p>

      {tab === 'open' ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink/45">
            {query.phoneMasked} · you see the full number once you take this query.
          </p>
          <button
            type="button"
            onClick={onClaim}
            disabled={busy || !canClaim}
            title={canClaim ? 'Uses 1 query credit' : 'No query credits left this month'}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <HandHeart className="h-4 w-4" />}
            Take this query
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">
              <Coins className="h-3 w-3" aria-hidden="true" /> 1 credit
            </span>
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <a
              href={`tel:+91${String(query.phone).replace(/\D/g, '').slice(-10)}`}
              className="flex items-center gap-2.5 rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
              {query.phone}
            </a>
            {query.email ? (
              <a
                href={`mailto:${query.email}`}
                className="flex min-w-0 items-center gap-2.5 rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm text-ink transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{query.email}</span>
              </a>
            ) : (
              <span className="flex items-center gap-2.5 rounded-xl border border-dashed border-ink/12 px-3.5 py-2.5 text-sm text-ink/40">
                <Mail className="h-4 w-4" aria-hidden="true" /> No email given
              </span>
            )}
          </div>

          {tab === 'mine' ? (
            <div className="mt-4 border-t border-ink/8 pt-4">
              {closing ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What came of it? (optional, only you see this)"
                    className="h-11 flex-1 rounded-xl border border-ink/12 px-3.5 text-sm outline-none focus:border-primary"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onResolve(note)}
                      disabled={busy}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Mark resolved
                    </button>
                    <button type="button" onClick={() => setClosing(false)} className="rounded-xl px-3 text-sm font-medium text-ink/60 hover:bg-ink/5">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setClosing(true)}
                    disabled={busy}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-brand transition-colors hover:bg-primary-dark disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark resolved
                  </button>
                  <button
                    type="button"
                    onClick={onRelease}
                    disabled={busy}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink/12 px-4 text-sm font-semibold text-ink/65 transition-colors hover:border-ink/25 hover:text-ink disabled:opacity-50"
                  >
                    <Undo2 className="h-4 w-4" /> Can’t help — release
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 flex items-center gap-2 border-t border-ink/8 pt-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Resolved {query.resolvedAt ? new Date(query.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              {query.resolutionNote ? ` · ${query.resolutionNote}` : ''}
            </p>
          )}
        </>
      )}
    </article>
  );
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }) : '';

/** This month's credits: how many are left, and when the month turns over. */
function CreditsBar({ credits }) {
  const pct = credits.allowance ? Math.round((credits.left / credits.allowance) * 100) : 0;
  const empty = credits.left === 0;
  const isTop = credits.planId === MEMBERSHIP_PLANS[MEMBERSHIP_PLANS.length - 1].id;

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${empty ? 'border-amber-200 bg-amber-50/70' : 'border-ink/8 bg-surface shadow-card'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${empty ? 'bg-amber-100 text-amber-700' : 'bg-accent/15 text-primary-dark'}`}>
            <Coins className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">
              <span className="text-lg">{credits.left}</span>
              <span className="text-ink/50"> of {credits.allowance}</span> query credits left
            </p>
            <p className="text-xs text-ink/50">
              {credits.planName} plan · 1 credit takes 1 query
              {credits.resetsAt ? ` · renews on ${fmtDate(credits.resetsAt)}` : ''}
            </p>
          </div>
        </div>
        {!isTop && (
          <Link
            href="/dashboard/plan"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/20 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/[0.06]"
          >
            <Crown className="h-4 w-4" aria-hidden="true" /> Get 25 a month with Gold
          </Link>
        )}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/8">
        <div className={`h-full rounded-full ${empty ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
      </div>
      {empty && (
        <p className="mt-2.5 text-xs text-amber-800">
          You have used this month’s credits. New queries stay visible, and you can take them again
          {credits.resetsAt ? ` from ${fmtDate(credits.resetsAt)}` : ' next month'}.
        </p>
      )}
    </div>
  );
}

/** Starter plan: the pool exists, but only paid plans can see into it. */
function LockedPool({ waiting }) {
  const paid = MEMBERSHIP_PLANS.filter((p) => p.queryCredits > 0);
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-card">
      <div className="bg-gradient-to-br from-primary to-primary-dark px-5 py-6 text-center text-white sm:px-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/10">
          <Lock className="h-6 w-6 text-accent" aria-hidden="true" />
        </span>
        <h2 className="mt-3 font-display text-xl font-semibold sm:text-2xl">
          {waiting > 0 ? `${waiting} client ${waiting === 1 ? 'query is' : 'queries are'} waiting` : 'Get client queries'}
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-white/75">
          People post their legal problem on Justiceland and a lawyer calls them. Queries are shown only to lawyers on a paid plan.
        </p>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
        {paid.map((p) => (
          <div key={p.id} className="rounded-xl border border-ink/10 p-4">
            <p className="text-sm font-semibold text-ink">{p.name}</p>
            <p className="mt-0.5 text-2xl font-bold text-ink">
              ₹{p.monthly}<span className="text-sm font-medium text-ink/45">/month</span>
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
              <Coins className="h-4 w-4" aria-hidden="true" /> {p.queryCredits} query credits every month
            </p>
          </div>
        ))}
        <p className="text-xs text-ink/50 sm:col-span-2">
          1 credit = 1 query. When you take a query you get the client’s name and number, and nobody else sees it. Plans are billed yearly.
        </p>
        <Link
          href="/dashboard/plan"
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E7C766] via-accent to-[#BC9A2E] text-sm font-bold text-[#241B02] shadow-gold sm:col-span-2"
        >
          <Crown className="h-4 w-4" aria-hidden="true" /> Upgrade to take queries
        </Link>
      </div>
    </div>
  );
}

/**
 * Client Queries — questions posted from the public site, shared by every
 * lawyer until one takes them.
 *
 * @param {object} props
 * @param {{open:Array, mine:Array, resolved:Array, categories:Array<string>}} props.data
 */
export default function QueriesWorkspace({ data }) {
  const router = useRouter();
  const [tab, setTab] = useState(data.open.length === 0 && data.mine.length > 0 ? 'mine' : 'open');
  const [category, setCategory] = useState('');
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const credits = data.credits || { hasPlan: false, left: 0 };

  const lists = { open: data.open, mine: data.mine, resolved: data.resolved };
  const shown = useMemo(() => {
    const rows = lists[tab] || [];
    return category ? rows.filter((q) => q.category === category) : rows;
  }, [tab, category, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (id, body, success) => {
    setBusyId(id);
    setError('');
    setErrorCode('');
    setMessage('');
    try {
      await act(id, body);
      setMessage(success);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setErrorCode(err.code || '');
      // Someone else took it — the pool has moved on, so refresh either way.
      router.refresh();
    } finally {
      setBusyId('');
    }
  };

  const counts = { open: data.locked ? data.openTotal : data.open.length, mine: data.mine.length, resolved: data.resolved.length };

  return (
    <div className="space-y-5">
      {(message || error) && (
        <p className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
          {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="flex-1">
            {error || message}
            {(errorCode === 'no_plan' || errorCode === 'no_credits') && (
              <Link href="/dashboard/plan" className="ml-1.5 font-semibold underline">
                See plans
              </Link>
            )}
          </span>
          <button type="button" onClick={() => { setError(''); setErrorCode(''); setMessage(''); }} aria-label="Dismiss">
            <X className="h-4 w-4 opacity-60" />
          </button>
        </p>
      )}

      {credits.hasPlan && <CreditsBar credits={credits} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                tab === key ? 'border-primary-dark bg-primary-dark text-white' : 'border-ink/10 bg-surface text-ink/65 hover:border-primary/40 hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
              <span className={`text-xs ${tab === key ? 'text-white/70' : 'text-ink/40'}`}>{counts[key]}</span>
            </button>
          ))}
        </nav>

        {data.categories.length > 0 && tab === 'open' && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-xl border border-ink/12 bg-surface px-3 text-sm text-ink/75 outline-none focus:border-primary"
          >
            <option value="">All practice areas</option>
            {data.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {tab === 'open' && data.locked ? (
        <LockedPool waiting={data.openTotal} />
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink/15 bg-surface px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink/40">
            {tab === 'open' ? <Inbox className="h-6 w-6" /> : tab === 'mine' ? <HandHeart className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
          </span>
          <p className="text-sm font-medium text-ink/70">
            {tab === 'open' ? 'No open queries right now' : tab === 'mine' ? 'You have not taken any query' : 'Nothing resolved yet'}
          </p>
          <p className="max-w-sm text-xs text-ink/45">
            {tab === 'open'
              ? 'Questions posted from the website appear here for every lawyer. Check back in a while.'
              : tab === 'mine'
                ? 'Take a query from the Open tab and the client’s number appears here.'
                : 'Queries you finish are kept here for your records.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {shown.map((q) => (
            <QueryCard
              key={q.id}
              query={q}
              tab={tab}
              busy={busyId === q.id}
              canClaim={credits.left > 0}
              onClaim={() => run(q.id, { action: 'claim' }, 'Query taken. The client’s number is in “My queries”.')}
              onRelease={() => run(q.id, { action: 'release' }, 'Released. Another lawyer can take it now.')}
              onResolve={(note) => run(q.id, { action: 'resolve', note }, 'Marked resolved. It is off every lawyer’s list.')}
            />
          ))}
        </div>
      )}

      {tab === 'open' && !data.locked && (
        <p className="flex items-start gap-2 rounded-xl bg-muted/70 px-4 py-3 text-xs leading-relaxed text-ink/55">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Only one lawyer can take a query, and taking it uses 1 credit. It then disappears from every other
          lawyer’s list, and when you mark it resolved it leaves the pool for good. Releasing a query does not
          return the credit.
        </p>
      )}
    </div>
  );
}
