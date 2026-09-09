'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Phone, ArrowRight, RotateCw, ShieldCheck, Loader2, Check, Pencil,
} from 'lucide-react';
import { trackMetaEvent } from '@/utils/metaPixel';

/**
 * How a lawyer gets into Justiceland — the whole of it.
 *
 * A number and a code, and nothing else. If the number already belongs to a
 * lawyer they are signed in and sent to their dashboard; if it does not, they
 * are handed to the guided setup, which asks for their name, email and city on
 * a full screen with room for it. There is no password anywhere in this flow.
 *
 * Deliberately only two steps. This card is a narrow box beside a marketing
 * panel — fine for ten digits and four more, cramped for a form. Everything
 * that needs space happens after, on /setup, where a step rail and a progress
 * ring can actually be seen.
 *
 * @param {object} props
 * @param {'register'|'login'} [props.intent]  changes only the words. The
 *   number decides what actually happens, so a lawyer who lands on the wrong
 *   page still ends up in the right place.
 */
const OTP_LENGTH = 4;

/** Both steps, and both are done by everyone — signing in or signing up. */
const PHASES = [
  { key: 'phone', label: 'Number' },
  { key: 'otp', label: 'Verify' },
];

export default function AdvocateAuthForm({ intent = 'register' }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState(() => Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const boxes = useRef([]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (step === 'otp') boxes.current[0]?.focus();
  }, [step]);

  const sendOtp = async (resend = false) => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/advocate/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.message || payload.error || 'Could not send the code. Please try again.');
        if (payload.retryAfter) setResendIn(payload.retryAfter);
        return;
      }
      setStep('otp');
      setResendIn(payload.resendIn || 30);
      if (resend) setDigits(Array(OTP_LENGTH).fill(''));
      setNotice(resend ? 'A new code is on its way.' : `Code sent to ${payload.sentTo || 'your phone'}.`);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (code) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/advocate/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.message || payload.error || 'Verification failed.');
        setDigits(Array(OTP_LENGTH).fill(''));
        boxes.current[0]?.focus();
        return;
      }

      // Either way the answer is a full page, not another field in this box:
      // a known number goes to the dashboard, a new one to the guided setup,
      // which asks for the name, email and city as its first step.
      window.location.href = payload.registered
        ? (payload.redirect || '/dashboard')
        : '/setup?new=1';
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  /** Type into a code box; auto-advance, and submit once every box is filled. */
  const onDigit = (i, value) => {
    const v = value.replace(/\D/g, '');
    if (!v) {
      setDigits((p) => p.map((d, n) => (n === i ? '' : d)));
      return;
    }
    setDigits((prev) => {
      const next = [...prev];
      // Pasting the whole code into one box fills the rest rather than keeping
      // only its first character.
      if (v.length > 1) {
        v.split('').slice(0, OTP_LENGTH - i).forEach((c, n) => { next[i + n] = c; });
        const last = Math.min(i + v.length, OTP_LENGTH - 1);
        setTimeout(() => boxes.current[last]?.focus(), 0);
      } else {
        next[i] = v;
        if (i < OTP_LENGTH - 1) setTimeout(() => boxes.current[i + 1]?.focus(), 0);
      }
      const code = next.join('');
      // Length alone is the test. An empty box contributes nothing to a
      // join(''), so a short code means a gap — and the `!code.includes('')`
      // that used to be here could never be true, because every string
      // contains the empty string. Auto-submit had simply never fired.
      if (code.length === OTP_LENGTH) {
        setTimeout(() => verifyOtp(code), 0);
      }
      return next;
    });
    setError('');
  };

  const onDigitKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) boxes.current[i + 1]?.focus();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    if (step === 'phone') sendOtp();
    else verifyOtp(digits.join(''));
  };

  const canSubmit =
    step === 'phone' ? /^[6-9]\d{9}$/.test(phone) : digits.every(Boolean);

  const HEAD = {
    phone: {
      title: intent === 'login' ? 'Log in' : 'Register as a lawyer',
      sub: 'Enter your mobile number — we will text you a code. No password to remember.',
    },
    otp: {
      title: 'Enter the code',
      sub: null, // the number is shown as an editable chip instead
    },
  }[step];

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mx-auto w-full max-w-[27rem] rounded-2xl border border-ink/8 bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.18)] sm:p-7"
    >
      <PhaseRail step={step} />

      <div className="mt-5">
        <h1 className="font-display text-[22px] font-semibold leading-tight text-ink sm:text-[26px]">
          {HEAD.title}
        </h1>
        {HEAD.sub && (
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/55">{HEAD.sub}</p>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {step === 'phone' && (
          <div>
            <label
              htmlFor="adv-auth-phone"
              className="mb-1.5 block text-[13px] font-medium text-ink/75"
            >
              Mobile number
            </label>
            {/* One control, two parts. A bare box the width of the card reads
                as "type anything"; the fixed +91 says what belongs in it and
                takes the country code out of the lawyer's hands entirely. */}
            <div className="flex items-stretch overflow-hidden rounded-xl border border-ink/15 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
              <span className="flex select-none items-center gap-1.5 border-r border-ink/12 bg-ink/[0.03] px-3 text-sm font-medium text-ink/60">
                <Phone className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
                +91
              </span>
              <input
                id="adv-auth-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setError('');
                }}
                placeholder="98765 43210"
                className="h-11 min-w-0 flex-1 bg-transparent px-3 text-[15px] tracking-[0.02em] text-ink outline-none placeholder:tracking-normal placeholder:text-ink/30"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div>
            {/* The number, and a way back to it. A wrong digit typed a screen
                ago is the commonest reason a code never arrives. */}
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-ink/[0.03] px-3 py-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink/70">
                Sent to <span className="font-semibold text-ink">+91 {phone}</span>
              </span>
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); setNotice(''); }}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-semibold text-primary transition-colors hover:bg-primary/8"
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
                Change
              </button>
            </div>

            <div className="flex justify-center gap-2.5 sm:gap-3">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { boxes.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  value={d}
                  onChange={(e) => onDigit(i, e.target.value)}
                  onKeyDown={(e) => onDigitKey(i, e)}
                  aria-label={`Digit ${i + 1}`}
                  className={`h-14 w-14 rounded-xl border text-center font-display text-xl font-bold text-ink outline-none transition-all sm:h-[3.75rem] sm:w-[3.75rem] ${
                    d
                      ? 'border-primary/40 bg-primary/[0.05]'
                      : 'border-ink/15 bg-surface'
                  } focus:border-primary focus:ring-2 focus:ring-primary/20`}
                />
              ))}
            </div>

            <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[12.5px]">
              <span className="text-ink/45">Did not get it?</span>
              <button
                type="button"
                onClick={() => sendOtp(true)}
                disabled={resendIn > 0 || loading}
                className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:underline disabled:text-ink/35 disabled:no-underline"
              >
                <RotateCw className="h-3 w-3" aria-hidden="true" />
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700">
            {error}
          </p>
        )}
        {!error && notice && (
          <p className="text-center text-[12.5px] text-emerald-700">{notice}</p>
        )}

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {loading
            ? (step === 'phone' ? 'Sending…' : 'Verifying…')
            : (step === 'phone' ? 'Send code' : 'Verify')}
          {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      {step === 'phone' && (
        <p className="mt-5 border-t border-ink/8 pt-4 text-center text-[12.5px] leading-relaxed text-ink/45">
          The same number registers you and signs you in — we work out which.
          <br />
          Looking for a lawyer instead?{' '}
          <Link href="/user/login" className="font-semibold text-primary hover:underline">
            Client login
          </Link>
        </p>
      )}
    </form>
  );
}

/* -------------------------------------------------------------------------- */

/** Two dots: where they are, and what is left of this card. */
function PhaseRail({ step }) {
  const phases = PHASES;
  const current = PHASES.findIndex((p) => p.key === step);

  return (
    <ol className="flex items-center gap-1.5">
      {phases.map((p, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={p.key} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors ${
                done
                  ? 'bg-emerald-500 text-white'
                  : active
                    ? 'bg-primary text-white'
                    : 'bg-ink/10 text-ink/40'
              }`}
            >
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span
              className={`hidden truncate text-[11.5px] font-medium sm:block ${
                active ? 'text-ink/80' : done ? 'text-ink/50' : 'text-ink/35'
              }`}
            >
              {p.label}
            </span>
            {i < phases.length - 1 && (
              <span
                className={`h-px min-w-3 flex-1 ${done ? 'bg-emerald-400/60' : 'bg-ink/10'}`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
