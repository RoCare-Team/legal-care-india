'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mail, Phone, MapPin, LogOut, Search, CalendarCheck, MessageCircle,
  UserRound, LayoutDashboard, Clock, RotateCcw,
  Wallet, Plus, ArrowDownLeft, ArrowUpRight, Loader2, Trash2, EyeOff,
} from 'lucide-react';
import { Avatar, Button } from '@/components/ui';
import ViewConversationButton from '@/components/consultation/ViewConversationButton';
import { logout } from '@/utils/logout';
import { refreshAuth } from '@/utils/authEvents';
import { formatDate } from '@/utils/formatters';

const NAV = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'consultations', label: 'Consultations', icon: CalendarCheck },
  { key: 'wallet', label: 'Wallet', icon: Wallet },
  { key: 'profile', label: 'Profile', icon: UserRound },
];

/** Presentation for each consultation status. */
const CONSULT_STATUS_META = {
  ended: { label: 'Completed', tone: 'bg-emerald-500/10 text-emerald-700' },
  active: { label: 'Ongoing', tone: 'bg-blue-500/10 text-blue-700' },
  pending: { label: 'Not answered', tone: 'bg-amber-500/10 text-amber-700' },
  rejected: { label: 'Declined', tone: 'bg-red-500/10 text-red-600' },
  cancelled: { label: 'Cancelled', tone: 'bg-ink/10 text-ink/50' },
};

/** Format a paise-safe rupee amount, e.g. 1500 -> "₹1,500". */
function formatMoney(value = 0) {
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/** "8 min 30 sec" / "8 min" / "45 sec" from a whole-second count. */
function formatLeftover(sec = 0) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m && s) return `${m} min ${s} sec`;
  if (m) return `${m} min`;
  return `${s} sec`;
}

/** What the amount column shows: Free for a resumed session, else the price. */
function amountLabel(c) {
  if (c.isResume) return 'Free';
  return c.charged ? formatMoney(c.price) : '—';
}

/**
 * AccountView — the logged-in client's account dashboard. A fixed left sidebar
 * (Overview / Consultations / Wallet / Profile) drives the main content on the
 * right.
 *
 * @param {object} props
 * @param {{ name: string, email: string, phone?: string, city?: string, photo?: string }} props.user
 * @param {Array} [props.consultations]  the user's consultations, newest first
 */
export default function AccountView({ user, consultations = [] }) {
  // Held locally so clearing a row updates the list and the stats at once.
  const [consultationList, setConsultationList] = useState(consultations);
  const searchParams = useSearchParams();
  const initialTab = NAV.some((n) => n.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'overview';
  const [view, setView] = useState(initialTab);

  const removeConsultation = (id) =>
    setConsultationList((prev) => prev.filter((c) => c.id !== id));

  return (
    <div className="w-full overflow-x-hidden bg-surface">
      {/* Same container as the header, so the sidebar lines up under the logo. */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 md:grid-cols-[16rem_minmax(0,1fr)]">
          {/* ── Fixed sidebar ─────────────────────────────────────────────── */}
        <aside className="relative flex flex-col border-b border-ink/8 bg-ink/[0.025] md:border-b-0 md:bg-transparent">
          {/* Desktop: the panel background bleeds out to the left viewport edge
              while the content stays aligned with the header container/logo. */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 hidden bg-ink/[0.025] md:block md:border-r md:border-ink/8 md:left-[calc((min(100vw,80rem)_-_100vw)_/_2_-_1.5rem)] lg:left-[calc((min(100vw,80rem)_-_100vw)_/_2_-_2rem)]"
            aria-hidden="true"
          />
          {/* Profile header — left padding removed so the avatar lines up with the logo. */}
          <div className="relative flex items-center gap-3 border-b border-ink/8 py-5 pl-0 pr-5">
            <Avatar src={user.photo} name={user.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-ink/50">{user.email}</p>
            </div>
          </div>

          {/* Fixed nav */}
          <nav className="relative flex-1 py-3 pr-3">
            <ul className="space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = view === item.key;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => setView(item.key)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? 'bg-primary/10 text-primary' : 'text-ink/65 hover:bg-ink/5 hover:text-ink'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                      {item.key === 'consultations' && consultationList.length > 0 && (
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          active ? 'bg-primary/15 text-primary' : 'bg-ink/10 text-ink/50'
                        }`}>
                          {consultationList.length}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer actions */}
          <div className="relative mt-auto space-y-2 border-t border-ink/8 py-4 pr-4">
            <Button href="/lawyers" size="sm" fullWidth leftIcon={<Search className="h-4 w-4" />}>
              Find Lawyers
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => logout('/')}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Log out
            </Button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="min-h-[28rem] p-6 sm:p-8">
          {view === 'overview' && (
            <OverviewView
              user={user}
              consultations={consultationList}
              onSeeConsultations={() => setView('consultations')}
            />
          )}
          {view === 'consultations' && (
            <ConsultationsView consultations={consultationList} onRemove={removeConsultation} />
          )}
          {view === 'wallet' && <WalletView user={user} />}
          {view === 'profile' && <ProfileView user={user} />}
        </main>
        </div>
      </div>
    </div>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────── */

function OverviewView({ user, consultations = [], onSeeConsultations }) {
  const firstName = user.name.split(' ')[0];
  const done = consultations.filter((c) => c.charged);
  const spent = done.reduce((sum, c) => sum + c.price, 0);
  const minutes = done.reduce((sum, c) => sum + c.talkedMinutes, 0);
  const recent = consultations.slice(0, 6);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink">Hi, {firstName} 👋</h2>
      <p className="mt-1 text-sm text-ink/55">Here&apos;s a summary of your account.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Wallet} value={formatMoney(user.walletBalance || 0)} label="Wallet balance" tone="text-amber-600 bg-amber-500/10" />
        <StatCard icon={CalendarCheck} value={done.length} label="Consultations" tone="text-emerald-600 bg-emerald-500/10" />
        <StatCard icon={Clock} value={minutes} label="Minutes talked" tone="text-blue-600 bg-blue-500/10" />
        <StatCard icon={ArrowUpRight} value={formatMoney(spent)} label="Total spent" tone="text-primary bg-primary/10" />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">Recent consultations</h3>
        {consultations.length > 0 && (
          <button type="button" onClick={onSeeConsultations} className="text-xs font-medium text-primary hover:underline">
            View all
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <EmptyConsultations />
      ) : (
        <ul className="mt-3 space-y-2.5">
          {recent.map((c) => {
            const meta = CONSULT_STATUS_META[c.status] || CONSULT_STATUS_META.cancelled;
            return (
              <li key={c.id} className="flex items-center gap-3 rounded-xl border border-ink/8 p-3.5">
                <Avatar name={c.advocateName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-ink">
                    <span className="truncate font-medium">{c.advocateName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
                      {meta.label}
                    </span>
                    {c.isResume && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-primary-dark">
                        <RotateCcw className="h-3 w-3" /> Resumed
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink/45">
                    {c.charged ? `${c.talkedMinutes} min talked · ` : ''}
                    {formatDate(c.createdAt)}
                  </p>
                  {c.resumeLeftoverSeconds > 0 && (
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                      <RotateCcw className="h-3 w-3" aria-hidden="true" />
                      {formatLeftover(c.resumeLeftoverSeconds)} left · resume free within 24h
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-semibold text-ink">
                  {amountLabel(c)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, tone }) {
  return (
    <div className="rounded-2xl border border-ink/8 p-4">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink/50">{label}</p>
    </div>
  );
}

/* ── Consultations ────────────────────────────────────────────────────── */

function ConsultationsView({ consultations = [], onRemove }) {
  const [busyId, setBusyId] = useState(null);

  // Clears the row from this user's list only — the lawyer keeps their record.
  const remove = async (c) => {
    const ok = window.confirm(
      `Remove your consultation with ${c.advocateName} from this list?\n\nThis only clears it from your account.`
    );
    if (!ok) return;
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/consultations/${c.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || 'Could not remove it. Please try again.');
        return;
      }
      onRemove?.(c.id);
    } catch {
      window.alert('Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (consultations.length === 0) {
    return (
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Consultations</h2>
        <p className="mt-1 text-sm text-ink/55">Your booked chat consultations with lawyers.</p>
        <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink/40">
            <CalendarCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink/70">No consultations yet</p>
            <p className="mt-0.5 text-xs text-ink/45">
              Book a consultation from any lawyer&apos;s profile to start a live chat.
            </p>
          </div>
          <Button href="/lawyers" size="sm" className="mt-1" leftIcon={<Search className="h-4 w-4" />}>
            Find Lawyers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink">Consultations</h2>
      <p className="mt-1 text-sm text-ink/55">Lawyers you booked and how long you talked.</p>

      <ul className="mt-6 space-y-3">
        {consultations.map((c) => {
          const meta = CONSULT_STATUS_META[c.status] || CONSULT_STATUS_META.cancelled;
          return (
            <li key={c.id} className="rounded-2xl border border-ink/8 p-4 shadow-card">
              <div className="flex items-start gap-3">
                <Avatar name={c.advocateName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display text-base font-semibold text-ink">
                      {c.advocateName}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
                      {meta.label}
                    </span>
                    {c.isResume && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-primary-dark">
                        <RotateCcw className="h-3 w-3" /> Resumed · Free
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink/45">{formatDate(c.createdAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-sm font-semibold text-ink">
                    {amountLabel(c)}
                  </span>
                  {c.charged && (
                    <ViewConversationButton id={c.id} otherName={c.advocateName} viewerRole="user" />
                  )}
                  {c.status !== 'active' && (
                    <button
                      type="button"
                      onClick={() => remove(c)}
                      disabled={busyId === c.id}
                      aria-label={`Remove consultation with ${c.advocateName}`}
                      title="Remove from my list"
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink/35 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    >
                      {busyId === c.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-ink/8 pt-3 text-xs text-ink/60">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
                  Booked {c.minutes} min
                </span>
                {c.charged && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
                    Talked {c.talkedMinutes} min
                  </span>
                )}
                {c.charged && (
                  <span className="inline-flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
                    {c.messagesCount} {c.messagesCount === 1 ? 'message' : 'messages'}
                  </span>
                )}
              </div>

              {/* Leftover time still free to reconnect with this lawyer. */}
              {c.resumeLeftoverSeconds > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/[0.07] px-3 py-2.5 text-xs text-ink/70">
                  <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>
                    <span className="font-semibold text-ink">{formatLeftover(c.resumeLeftoverSeconds)} left.</span>{' '}
                    Reopen {c.advocateName}&apos;s profile and tap <span className="font-medium text-ink">Book</span> to
                    resume this time free — available for 24 hours.
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Wallet ───────────────────────────────────────────────────────────── */

const QUICK_AMOUNTS = [100, 500, 1000, 2000];

function WalletView({ user }) {
  const [balance, setBalance] = useState(user.walletBalance || 0);
  const [transactions, setTransactions] = useState(user.walletTransactions || []);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMoney = async () => {
    setError('');
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not add money.');
        return;
      }
      setBalance(data.balance);
      setTransactions(data.transactions);
      setAmount('');
      // Tell the navbar (and any other useAuth consumer) the balance changed.
      refreshAuth();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink">Wallet</h2>
      <p className="mt-1 text-sm text-ink/55">Add money to your wallet and track your balance.</p>

      {/* Balance card */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A5F] to-[#0F172A] p-6 text-white shadow-card">
        <div className="flex items-center gap-2 text-white/70">
          <Wallet className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-wider">Available balance</span>
        </div>
        <p className="mt-2 font-display text-4xl font-bold">{formatMoney(balance)}</p>
      </div>

      {/* Add money */}
      <div className="mt-6 rounded-2xl border border-ink/8 p-5">
        <h3 className="font-display text-base font-semibold text-ink">Add money</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setAmount(String(amt))}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                String(amt) === amount
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-ink/12 text-ink/70 hover:border-primary/40 hover:text-primary'
              }`}
            >
              ₹{amt.toLocaleString('en-IN')}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/50">₹</span>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full rounded-xl border border-ink/12 py-2.5 pl-7 pr-3 text-sm text-ink outline-none transition-colors focus:border-primary"
            />
          </div>
          <Button
            type="button"
            onClick={addMoney}
            disabled={loading}
            leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          >
            {loading ? 'Adding…' : 'Add money'}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Transaction history */}
      <div className="mt-8">
        <h3 className="font-display text-lg font-semibold text-ink">Transaction history</h3>
        {transactions.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/15 py-10 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-ink/5 text-ink/40">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-ink/70">No transactions yet</p>
            <p className="text-xs text-ink/45">Money you add will show up here.</p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {transactions.map((t) => {
              const credit = t.type === 'credit';
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-xl border border-ink/8 p-3.5">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                      credit ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                    }`}
                  >
                    {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{t.note || (credit ? 'Added to wallet' : 'Spent')}</p>
                    <p className="text-xs text-ink/45">{formatDate(t.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold ${credit ? 'text-emerald-600' : 'text-red-600'}`}>
                    {credit ? '+' : '−'}{formatMoney(t.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Profile ──────────────────────────────────────────────────────────── */

function ProfileView({ user }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar src={user.photo} name={user.name} size="lg" />
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold text-ink">{user.name}</h2>
          <p className="text-sm text-ink/55">Your Legal Care India account</p>
        </div>
      </div>

      <dl className="mt-7 max-w-md divide-y divide-ink/8 border-t border-ink/8">
        <DetailRow icon={UserRound} label="Name" value={user.name} />
        <DetailRow icon={Mail} label="Email" value={user.email} />
        <DetailRow icon={Phone} label="Mobile" value={user.phone} />
        <DetailRow icon={MapPin} label="City" value={user.city} />
      </dl>

      <div className="mt-7 max-w-md">
        <h3 className="text-sm font-semibold text-ink">Privacy</h3>
        <AnonymousSetting initial={user.anonymous} />
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        <Button href="/lawyers" leftIcon={<Search className="h-4 w-4" />}>
          Find Lawyers
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => logout('/')}
          leftIcon={<LogOut className="h-4 w-4" />}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}

/** The "hide my name from lawyers" preference — saves instantly on toggle. */
function AnonymousSetting({ initial = false }) {
  const [anonymous, setAnonymous] = useState(Boolean(initial));
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    if (saving) return;
    const next = !anonymous;
    setSaving(true);
    setAnonymous(next); // optimistic
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonymous: next }),
      });
      if (!res.ok) setAnonymous(!next); // revert on failure
    } catch {
      setAnonymous(!next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      role="switch"
      aria-checked={anonymous}
      className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-ink/10 px-3.5 py-3 text-left transition-colors hover:border-primary/30 disabled:opacity-70"
    >
      <span className="flex items-center gap-2.5">
        <EyeOff className={`h-4 w-4 shrink-0 ${anonymous ? 'text-primary' : 'text-ink/40'}`} />
        <span>
          <span className="block text-sm font-medium text-ink">Stay anonymous</span>
          <span className="block text-xs text-ink/50">
            {anonymous
              ? 'Lawyers see you as “Anonymous” — your name stays hidden.'
              : 'Lawyers can see your name when you consult them.'}
          </span>
        </span>
      </span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          anonymous ? 'bg-primary' : 'bg-ink/20'
        }`}
      >
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow transition-transform ${
            anonymous ? 'translate-x-6' : 'translate-x-1'
          }`}
        >
          {saving && <Loader2 className="h-3 w-3 animate-spin text-ink/50" />}
        </span>
      </span>
    </button>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <dt className="w-20 shrink-0 text-sm text-ink/50">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-medium text-ink/80">{value || '—'}</dd>
    </div>
  );
}

function EmptyConsultations() {
  return (
    <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink/40">
        <CalendarCheck className="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-medium text-ink/70">No consultations yet</p>
        <p className="mt-0.5 text-xs text-ink/45">
          Book a live chat from any lawyer&apos;s profile and it will show up here.
        </p>
      </div>
      <Button href="/lawyers" size="sm" className="mt-1" leftIcon={<Search className="h-4 w-4" />}>
        Find Lawyers
      </Button>
    </div>
  );
}
