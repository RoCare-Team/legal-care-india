'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Button, FormField, Input } from '@/components/ui';
import { safeNextPath } from '@/utils/safeNext';

/**
 * UserLoginForm — client (user) sign-in card. Routes to the user account page.
 */
export default function UserLoginForm() {
  const [data, setData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setData((p) => ({ ...p, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!data.email || !data.password) {
      setError('Enter your email and password to continue.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Login failed. Please try again.');
        return;
      }
      window.location.href = safeNextPath('/');
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card sm:p-8"
    >
      <h1 className="font-display text-2xl font-semibold text-ink">Log In</h1>
      <p className="mt-1 text-sm text-ink/55">Welcome back — sign in to your account.</p>

      <div className="mt-6 space-y-4">
        <FormField label="Email Address" htmlFor="user-login-email">
          <Input
            id="user-login-email"
            type="email"
            value={data.email}
            onChange={set('email')}
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
          />
        </FormField>
        <FormField label="Password" htmlFor="user-login-password">
          <Input
            id="user-login-password"
            type="password"
            value={data.password}
            onChange={set('password')}
            placeholder="Your password"
            leftIcon={<Lock className="h-4 w-4" />}
          />
        </FormField>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex items-center justify-end text-sm">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" fullWidth disabled={loading} leftIcon={<LogIn className="h-4 w-4" />}>
          {loading ? 'Logging in…' : 'Log In'}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-ink/60">
        New to Legal Care India?{' '}
        <Link href="/user/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-ink/50">
        Are you an advocate?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Advocate login
        </Link>
      </p>
    </form>
  );
}
