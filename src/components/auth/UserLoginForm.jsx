'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Phone, KeyRound, ArrowLeft, LogIn, RotateCw, UserRound } from 'lucide-react';
import { Button, FormField, Input } from '@/components/ui';
import { safeNextPath } from '@/utils/safeNext';
import { trackMetaEvent } from '@/utils/metaPixel';

/**
 * UserLoginForm — mobile-number sign-in for clients.
 *
 * There is no separate sign-up: entering a number that has never been used
 * creates the account once the code checks out. That is why nothing here asks
 * whether you are new.
 *
 * Three steps, one card. `phone` → `otp` → `name`, where the last only appears
 * for an account that has no name yet.
 */
// Length is set by the SMS gateway, which sends a 4-digit code.
const OTP_LENGTH = 4;

export default function UserLoginForm() {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [digits, setDigits] = useState(() => Array(OTP_LENGTH).fill(''));
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const boxes = useRef([]);

  // Resend countdown.
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Focus the first code box as soon as that step appears.
  useEffect(() => {
    if (step === 'otp') boxes.current[0]?.focus();
  }, [step]);

  const finish = useCallback(() => {
    window.location.href = safeNextPath('/');
  }, []);

  const sendOtp = async (resend = false) => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/user/otp/send', {
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
      setNotice(`Code sent to ${payload.sentTo || 'your phone'}.`);
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
      const res = await fetch('/api/auth/user/otp/verify', {
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
      // `created` is the only honest signal that this was a sign-up: the same
      // form logs existing clients in, and firing CompleteRegistration for
      // them would count every returning visitor as a new one.
      if (payload.created) {
        trackMetaEvent('CompleteRegistration', {
          content_name: 'Client account',
          status: 'mobile_otp',
        });
      }

      // Signed in either way. A name is asked for only when we have none —
      // the account already exists at this point, so skipping is safe.
      if (payload.needsName) {
        setNotice('');
        setStep('name');
      } else if (payload.created) {
        // A hard navigation cancels the pixel's in-flight beacon, so give it a
        // moment. Only on the sign-up path — a plain login waits for nothing.
        setTimeout(finish, 300);
      } else {
        finish();
      }
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveName = async () => {
    const clean = name.trim();
    if (clean.length < 2) {
      setError('Enter your name so lawyers know who they are speaking to.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: clean }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error || 'Could not save your name.');
        return;
      }
      finish();
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
      // Pasting the whole code into one box fills the rest rather than
      // keeping only its first character.
      if (v.length > 1) {
        v.split('').slice(0, OTP_LENGTH - i).forEach((c, n) => { next[i + n] = c; });
        const last = Math.min(i + v.length, OTP_LENGTH - 1);
        setTimeout(() => boxes.current[last]?.focus(), 0);
      } else {
        next[i] = v;
        if (i < OTP_LENGTH - 1) setTimeout(() => boxes.current[i + 1]?.focus(), 0);
      }
      const code = next.join('');
      if (code.length === OTP_LENGTH && !code.includes('')) {
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
    if (step === 'phone') sendOtp();
    else if (step === 'otp') verifyOtp(digits.join(''));
    else saveName();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card sm:p-8"
    >
      <div className="flex items-center gap-3">
        {step !== 'phone' && step !== 'name' && (
          <button
            type="button"
            onClick={() => { setStep('phone'); setError(''); setNotice(''); }}
            aria-label="Change number"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {step === 'phone' ? <Phone className="h-5 w-5" />
            : step === 'otp' ? <KeyRound className="h-5 w-5" />
            : <UserRound className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-ink">
            {step === 'phone' ? 'Log In' : step === 'otp' ? 'Verify Your Number' : 'One Last Thing'}
          </h1>
          <p className="mt-0.5 text-sm text-ink/55">
            {step === 'phone'
              ? 'Enter your mobile number — no password needed.'
              : step === 'otp'
                ? <>Code sent to <span className="font-medium text-ink/75">+91 {phone}</span></>
                : 'What should lawyers call you?'}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {step === 'phone' && (
          <FormField label="Mobile Number" htmlFor="user-login-phone">
            <Input
              id="user-login-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                setError('');
              }}
              placeholder="10-digit mobile"
              leftIcon={<Phone className="h-4 w-4" />}
              autoFocus
            />
          </FormField>
        )}

        {step === 'otp' && (
          <div>
            <span className="mb-2 block text-sm font-medium text-ink/80">{OTP_LENGTH}-digit code</span>
            <div className="flex justify-between gap-2">
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
                  className="h-12 w-full min-w-0 rounded-xl border border-ink/15 bg-surface text-center font-display text-lg font-semibold text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => sendOtp(true)}
                disabled={resendIn > 0 || loading}
                className="inline-flex items-center gap-1.5 font-medium text-primary transition-colors hover:underline disabled:text-ink/35 disabled:no-underline"
              >
                <RotateCw className="h-3.5 w-3.5" />
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </button>
              <span className="text-xs text-ink/45">Valid for 5 minutes</span>
            </div>
          </div>
        )}

        {step === 'name' && (
          <FormField label="Your Name" htmlFor="user-login-name">
            <Input
              id="user-login-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Your full name"
              leftIcon={<UserRound className="h-4 w-4" />}
              autoFocus
            />
          </FormField>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
        {!error && notice && <p className="text-xs text-emerald-700">{notice}</p>}

        <Button
          type="submit"
          fullWidth
          disabled={loading}
          leftIcon={step === 'phone' ? <Phone className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
        >
          {loading
            ? (step === 'phone' ? 'Sending…' : step === 'otp' ? 'Verifying…' : 'Saving…')
            : (step === 'phone' ? 'Send Code' : step === 'otp' ? 'Verify & Log In' : 'Continue')}
        </Button>

        {step === 'name' && (
          <button
            type="button"
            onClick={finish}
            className="w-full text-center text-sm text-ink/50 transition-colors hover:text-ink/75"
          >
            Skip for now
          </button>
        )}
      </div>

      {step === 'phone' && (
        <p className="mt-6 text-center text-sm text-ink/50">
          Are you a lawyer?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Lawyer login
          </Link>
        </p>
      )}
    </form>
  );
}
