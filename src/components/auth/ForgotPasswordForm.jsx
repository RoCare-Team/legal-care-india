'use client';

import { useState } from 'react';
import { Mail, Send, Lock, KeyRound, ShieldCheck, CheckCircle2, ArrowLeft, Smartphone } from 'lucide-react';
import { Button, FormField, Input } from '@/components/ui';

/**
 * ForgotPasswordForm — a 2-step OTP password reset:
 *   1. Enter registered email → a 6-digit code is sent to email + phone.
 *   2. Enter the code + a new password → password is reset.
 */
export default function ForgotPasswordForm() {
  const [step, setStep] = useState(1); // 1 = request, 2 = verify, 3 = done
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState('email'); // 'email' | 'phone'
  const [sentTo, setSentTo] = useState(null);

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e?.preventDefault();
    if (!email) {
      setError('Enter your registered email address.');
      return;
    }
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, channel }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Something went wrong. Please try again.');
        return;
      }
      setSentTo(payload.sentTo || null);
      setStep(2);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not reset your password. Please try again.');
        return;
      }
      setStep(3);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setOtp('');
    setInfo('');
    await requestOtp();
    setInfo('A new code has been sent.');
  };

  // Step 3 — success
  if (step === 3) {
    return (
      <div className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Password reset</h1>
        <p className="mt-2 text-sm text-ink/60">
          Your password has been updated. You can now log in with your new password.
        </p>
        <Button href="/login" className="mt-6" leftIcon={<KeyRound className="h-4 w-4" />}>
          Go to login
        </Button>
      </div>
    );
  }

  // Step 2 — verify OTP + set new password
  if (step === 2) {
    return (
      <form
        onSubmit={verifyOtp}
        className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card sm:p-8"
      >
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Enter the code</h1>
        <p className="mt-1 text-sm text-ink/55">
          We sent a 6-digit code to your {channel === 'phone' ? 'phone' : 'email'}
          {sentTo ? (
            <> <span className="font-medium text-ink">{sentTo}</span></>
          ) : null}
          . It is valid for 10 minutes.
        </p>

        <div className="mt-6 space-y-4">
          <FormField label="6-digit code" htmlFor="otp">
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              leftIcon={<KeyRound className="h-4 w-4" />}
              className="tracking-[0.4em]"
            />
          </FormField>
          <FormField label="New Password" htmlFor="new-password">
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              leftIcon={<Lock className="h-4 w-4" />}
            />
          </FormField>
          <FormField label="Confirm New Password" htmlFor="confirm-password">
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your new password"
              leftIcon={<Lock className="h-4 w-4" />}
            />
          </FormField>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {info && <p className="text-xs text-emerald-600">{info}</p>}

          <Button type="submit" fullWidth disabled={loading} leftIcon={<KeyRound className="h-4 w-4" />}>
            {loading ? 'Resetting…' : 'Reset password'}
          </Button>
        </div>

        <div className="mt-5 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setError('');
              setInfo('');
            }}
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Change email
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={loading}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            Resend code
          </button>
        </div>
      </form>
    );
  }

  // Step 1 — request the code
  return (
    <form
      onSubmit={requestOtp}
      className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card sm:p-8"
    >
      <h1 className="font-display text-2xl font-semibold text-ink">Forgot password?</h1>
      <p className="mt-1 text-sm text-ink/55">
        Enter your registered email and choose where to receive your 6-digit reset code.
      </p>

      <div className="mt-6 space-y-4">
        <FormField label="Email Address" htmlFor="forgot-email">
          <Input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
          />
        </FormField>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">Send code via</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'email', label: 'Email', icon: Mail },
              { key: 'phone', label: 'Phone (SMS)', icon: Smartphone },
            ].map(({ key, label, icon: Icon }) => {
              const active = channel === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChannel(key)}
                  aria-pressed={active}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-ink/15 text-ink/60 hover:border-ink/30 hover:text-ink'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <Button type="submit" fullWidth disabled={loading} leftIcon={<Send className="h-4 w-4" />}>
          {loading ? 'Sending…' : `Send code to ${channel === 'phone' ? 'phone' : 'email'}`}
        </Button>
      </div>

      <a
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to login
      </a>
    </form>
  );
}
