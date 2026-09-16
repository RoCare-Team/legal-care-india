'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import {
  Send, CheckCircle2, ShieldCheck, Phone, AlertCircle, Loader2, Clock, Lock, Check,
} from 'lucide-react';
import { FormField, Input, Textarea } from '@/components/ui';
import { cn } from '@/utils/cn';

const MIN_MESSAGE = 20;

/**
 * Topics in the words people use for their trouble, not the names of the
 * practice areas. Nobody with a landlord problem thinks "Civil Law"; they think
 * "property". Each one files the question under the category lawyers filter by.
 */
const TOPICS = [
  { label: 'Property / Land', category: 'Property Law' },
  { label: 'Divorce / Family', category: 'Family Law' },
  { label: 'Police / FIR', category: 'Criminal Law' },
  { label: 'Money / Cheque bounce', category: 'Civil Law' },
  { label: 'Job / Salary', category: 'Labour & Employment' },
  { label: 'Consumer complaint', category: 'Consumer Law' },
];

const EMPTY = { name: '', phone: '', email: '', category: '', city: '', message: '', website: '' };

/**
 * The "ask a lawyer" form — no account, no payment.
 *
 * Two numbered steps, because that is the whole deal and a stranger should see
 * it at a glance: tell us the problem, tell us where to call you. Everything
 * else (topic, city, email) is optional and filled in for them where the page
 * already knows it.
 *
 * `compact` is the popup version: no email and no card of its own, since the
 * dialog supplies the chrome.
 *
 * @param {object} props
 * @param {Array<string>} [props.cities]
 * @param {boolean} [props.compact=false]
 * @param {{ category?: string, city?: string, name?: string, phone?: string }} [props.defaults]
 * @param {() => void} [props.onDone]   the popup's close, offered once sent
 * @param {() => void} [props.onSent]
 */
export default function AskQueryForm({ cities = [], compact = false, defaults = {}, onDone, onSent }) {
  const uid = useId();
  const fid = (name) => `${uid}-${name}`;

  const initial = () => ({
    ...EMPTY,
    category: defaults.category || '',
    city: defaults.city || '',
    name: defaults.name || '',
    phone: defaults.phone || '',
  });
  const [data, setData] = useState(initial);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setData((p) => ({ ...p, [field]: e.target.value }));
  const phoneDigits = data.phone.replace(/\D/g, '');
  const messageLeft = Math.max(0, MIN_MESSAGE - data.message.trim().length);
  const ready = data.name.trim().length >= 2 && phoneDigits.length === 10 && messageLeft === 0;

  // The page's own practice area goes first when it is not one of the six.
  const topics = defaults.category && !TOPICS.some((t) => t.category === defaults.category)
    ? [{ label: defaults.category, category: defaults.category }, ...TOPICS]
    : TOPICS;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (sending || !ready) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compact ? { ...data, email: '' } : data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Could not send your problem. Please try again.');
        return;
      }
      setSent(true);
      onSent?.();
      if (!compact) {
        // The confirmation replaces a long form, so without this the visitor is
        // left scrolled past it looking at the footer.
        requestAnimationFrame(() => {
          document.getElementById('ask-query')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    } catch {
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div
        id={compact ? undefined : 'ask-query'}
        className={cn(
          'text-center',
          compact ? 'py-4' : 'scroll-mt-28 rounded-3xl border border-emerald-200 bg-surface p-8 shadow-card sm:p-10'
        )}
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-9 w-9 text-emerald-500" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink">Done! A lawyer will call you</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/60">
          Your problem has reached our verified lawyers. The one who takes it up will call you on{' '}
          <span className="font-semibold text-ink">+91 {phoneDigits.replace(/(\d{5})(\d{5})/, '$1 $2')}</span>.
          Nobody else sees your number.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onDone ? (
            <button
              type="button"
              onClick={onDone}
              className="inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-brand transition-colors hover:bg-primary-dark"
            >
              OK, got it
            </button>
          ) : (
            <Link
              href="/lawyers"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-brand transition-colors hover:bg-primary-dark"
            >
              Talk to a lawyer now
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setData({ ...initial(), name: data.name, phone: data.phone });
              setSent(false);
            }}
            className="inline-flex h-11 items-center rounded-xl border border-ink/12 px-5 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/25 hover:text-ink"
          >
            Ask another question
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={compact ? '' : 'rounded-3xl border border-ink/8 bg-surface p-5 shadow-card sm:p-7'}
      noValidate
    >
      {/* ── Step 1: the problem ─────────────────────────────────── */}
      <StepTitle n={1} done={messageLeft === 0}>What is your problem?</StepTitle>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Topic (optional)">
        {topics.map((t) => {
          const on = data.category === t.category;
          return (
            <button
              key={t.category}
              type="button"
              aria-pressed={on}
              onClick={() => setData((p) => ({ ...p, category: on ? '' : t.category }))}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
                on
                  ? 'border-primary bg-primary text-white'
                  : 'border-ink/12 bg-surface text-ink/70 hover:border-primary/40 hover:text-primary'
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <label htmlFor={fid('message')} className="sr-only">Describe your problem</label>
      <Textarea
        id={fid('message')}
        rows={compact ? 4 : 5}
        value={data.message}
        onChange={set('message')}
        className="mt-3 text-[15px]"
        placeholder="Write in your own words, in English or Hindi. e.g. My landlord is not returning my ₹60,000 deposit for 3 months."
      />
      <p className={cn('mt-1.5 text-xs', messageLeft === 0 ? 'text-emerald-600' : 'text-ink/45')}>
        {messageLeft === 0
          ? 'Looks good. Don’t share bank details or passwords.'
          : data.message.trim()
            ? `Write a little more — ${messageLeft} more letters`
            : 'A few lines are enough.'}
      </p>

      {/* ── Step 2: where to call ───────────────────────────────── */}
      <div className="mt-6">
        <StepTitle n={2} done={ready}>Where should the lawyer call you?</StepTitle>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-4">
        <FormField label="Your name" htmlFor={fid('name')} required>
          <Input id={fid('name')} value={data.name} onChange={set('name')} placeholder="Full name" autoComplete="name" />
        </FormField>
        <FormField label="Mobile number" htmlFor={fid('phone')} required>
          <Input
            id={fid('phone')}
            value={data.phone}
            onChange={set('phone')}
            inputMode="numeric"
            maxLength={14}
            placeholder="10-digit mobile"
            autoComplete="tel"
            leftIcon={<Phone className="h-4 w-4" />}
          />
        </FormField>
        <FormField label="City" htmlFor={fid('city')}>
          <Input id={fid('city')} list={fid('cities')} value={data.city} onChange={set('city')} placeholder="e.g. Delhi" />
        </FormField>
        {!compact && (
          <FormField label="Email (optional)" htmlFor={fid('email')}>
            <Input id={fid('email')} type="email" value={data.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
          </FormField>
        )}
      </div>
      <datalist id={fid('cities')}>
        {cities.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor={fid('website')}>Website</label>
        <input id={fid('website')} tabIndex={-1} autoComplete="off" value={data.website} onChange={set('website')} />
      </div>

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending || !ready}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E7C766] via-accent to-[#BC9A2E] py-3.5 text-[15px] font-bold text-[#241B02] shadow-gold transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Get a free call from a lawyer
      </button>

      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-ink/50">
        <li className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> Number stays private
        </li>
        <li className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> Verified lawyers
        </li>
        <li className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> No login, free
        </li>
      </ul>
    </form>
  );
}

function StepTitle({ n, done, children }) {
  return (
    <p className="flex items-center gap-2.5 text-base font-semibold text-ink">
      <span
        className={cn(
          'grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors',
          done ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary'
        )}
      >
        {done ? <Check className="h-4 w-4" aria-hidden="true" /> : n}
      </span>
      {children}
    </p>
  );
}
