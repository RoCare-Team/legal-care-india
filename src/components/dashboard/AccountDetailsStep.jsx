'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  UserRound, Mail, MapPin, ArrowRight, Loader2, Check, ShieldCheck, Pencil,
  Scale, GraduationCap, Timer, Building2, AlignLeft,
} from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { PROFILE_STEPS } from '@/lib/profileCompletion';

/**
 * The first step of the guided setup, and the one that creates the account.
 *
 * It lives here rather than in the sign-in card because it is a form, and the
 * sign-in card is a narrow box beside a marketing panel. Three labelled fields
 * in that box read as a cramped afterthought; here they get the same full
 * screen, the same rail and the same rhythm as every step that follows, so a
 * lawyer's first impression of the setup is the setup rather than a popup.
 *
 * There is no session yet — the account does not exist until this submits — so
 * the page reaches this component on the strength of the httpOnly proof set
 * when the code was verified. That is also why the number below is shown but
 * not editable: it is a fact the server established, not a field.
 *
 * @param {object} props
 * @param {string} props.phone  the verified number, from the server
 * @param {Array<{name: string}>} props.cities
 */
const RAIL_ICONS = {
  practice: Scale,
  presence: UserRound,
  credentials: GraduationCap,
  consultations: Timer,
  office: Building2,
  about: AlignLeft,
};

export default function AccountDetailsStep({ phone, cities = [] }) {
  const [values, setValues] = useState({ name: '', email: '', city: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setError('');
  };

  const ready =
    values.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()) &&
    values.city.trim().length > 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || saving) return;

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/auth/advocate/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          city: values.city.trim(),
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.message || payload.error || 'Could not create your account.');
        // The proof of the number has expired. Nothing on this screen can fix
        // that, so send them back to the one thing that can.
        if (payload.error === 'expired') {
          setTimeout(() => { window.location.href = '/register'; }, 1800);
        }
        return;
      }
      // A full navigation, not a router push: the session cookie has just been
      // set and every server component on the next page needs to see it.
      window.location.href = payload.redirect || '/setup?new=1';
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // The road ahead, drawn from the same list the setup itself uses so this
  // screen cannot promise steps that do not exist.
  const ahead = PROFILE_STEPS;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <header className="sticky top-0 z-30 border-b border-ink/8 bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Logo className="h-8" />
          <span className="ml-auto text-[12.5px] font-medium text-ink/45">
            Step 1 of {ahead.length + 1}
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
          {/* The same rail the rest of the setup uses, with everything after
              this step shown but not yet reachable — it exists to say how far
              this goes, not to be clicked. */}
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)]">
              <div className="flex items-center gap-2 text-emerald-700">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500">
                  <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                </span>
                <p className="text-[13px] font-semibold">Number verified</p>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink/55">
                Your account is created on this step. After that, {ahead.length} short
                steps and your profile goes for review.
              </p>
            </div>

            <ol className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:mt-3 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
              <li className="min-w-[9.5rem] flex-1 lg:min-w-0 lg:flex-none">
                <div className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.06] px-3 py-2.5 shadow-[inset_2px_0_0_0_#1E3A5F]">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-white">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      Your details
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink/40">
                      Creates your account
                    </span>
                  </span>
                </div>
              </li>

              {ahead.map((s) => {
                const Icon = RAIL_ICONS[s.id] || Check;
                return (
                  <li key={s.id} className="min-w-[9.5rem] flex-1 lg:min-w-0 lg:flex-none">
                    <div className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 opacity-55">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/[0.07] text-ink/40">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-ink/55">
                          {s.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-ink/35">
                          {s.items.length} {s.items.length === 1 ? 'detail' : 'details'}
                        </span>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <form onSubmit={submit} noValidate className="min-w-0">
            <section className="overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)]">
              <div className="border-b border-ink/8 bg-gradient-to-b from-ink/[0.015] to-transparent px-5 py-3.5 sm:px-7 sm:py-4">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <h1 className="font-display text-[19px] font-semibold leading-tight text-ink sm:text-xl">
                    Your details
                  </h1>
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary/60">
                    Step 1 of {ahead.length + 1}
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-[12.5px] leading-snug text-ink/55">
                  Three fields and your account exists. Everything else is asked
                  for on the steps after this one, and saved as you go.
                </p>
              </div>

              <div className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/70 bg-emerald-50 px-3.5 py-3">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <p className="min-w-0 flex-1 text-[13px] leading-snug text-emerald-900">
                    <span className="font-semibold">+91 {phone}</span> verified — this is
                    the number clients will reach you on.
                  </p>
                  <Link
                    href="/register"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                  >
                    <Pencil className="h-3 w-3" aria-hidden="true" />
                    Change
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="acc-name" label="Full name" icon={UserRound} className="sm:col-span-2">
                    <input
                      id="acc-name"
                      value={values.name}
                      onChange={set('name')}
                      placeholder="Adv. Your Name"
                      autoComplete="name"
                      autoFocus
                      className={INPUT}
                    />
                  </Field>

                  <Field id="acc-email" label="Email address" icon={Mail}>
                    <input
                      id="acc-email"
                      type="email"
                      value={values.email}
                      onChange={set('email')}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={INPUT}
                    />
                  </Field>

                  <Field
                    id="acc-city"
                    label="City you practise in"
                    icon={MapPin}
                    hint="You can add more cities later."
                  >
                    <input
                      id="acc-city"
                      list="acc-cities"
                      value={values.city}
                      onChange={set('city')}
                      placeholder="Start typing your city"
                      autoComplete="off"
                      className={INPUT}
                    />
                    <datalist id="acc-cities">
                      {cities.map((c) => (
                        <option key={c.name} value={c.name} />
                      ))}
                    </datalist>
                  </Field>
                </div>

                {error && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
                    {error}
                  </p>
                )}
              </div>
            </section>

            <div className="sticky bottom-4 z-20 mt-5 flex items-center justify-end gap-3 rounded-2xl border border-ink/8 bg-surface/95 p-3 shadow-[0_-2px_8px_rgba(16,24,40,0.04),0_12px_32px_-12px_rgba(16,24,40,0.2)] backdrop-blur-md sm:p-3.5">
              <button
                type="submit"
                disabled={!ready || saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {saving ? 'Creating your account…' : 'Create account & continue'}
                {!saving && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const INPUT =
  'h-11 w-full rounded-xl border border-ink/15 bg-surface pl-10 pr-3 text-[14.5px] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-primary focus:ring-2 focus:ring-primary/15';

function Field({ id, label, icon: Icon, hint, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink/75">
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35"
          aria-hidden="true"
        />
        {children}
      </div>
      {hint && <p className="mt-1 text-[11.5px] text-ink/40">{hint}</p>}
    </div>
  );
}
