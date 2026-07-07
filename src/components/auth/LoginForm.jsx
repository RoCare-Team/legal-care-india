'use client';

import { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Button, FormField, Input } from '@/components/ui';

/**
 * LoginForm — advocate sign-in card (UI only; routes to the dashboard).
 */
export default function LoginForm() {
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Login failed. Please try again.');
        return;
      }
      window.location.href = '/dashboard';
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
      <h1 className="font-display text-2xl font-semibold text-ink">Advocate Login</h1>
      <p className="mt-1 text-sm text-ink/55">Welcome back — sign in to manage your profile.</p>

      <div className="mt-6 space-y-4">
        <FormField label="Email Address" htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            value={data.email}
            onChange={set('email')}
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
          />
        </FormField>
        <FormField label="Password" htmlFor="login-password">
          <Input
            id="login-password"
            type="password"
            value={data.password}
            onChange={set('password')}
            placeholder="Your password"
            leftIcon={<Lock className="h-4 w-4" />}
          />
        </FormField>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink/60">
            <input type="checkbox" className="h-4 w-4 rounded border-ink/30 text-primary focus:ring-primary/40" />
            Remember me
          </label>
          <a href="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot password?
          </a>
        </div>

        <Button type="submit" fullWidth disabled={loading} leftIcon={<LogIn className="h-4 w-4" />}>
          {loading ? 'Logging in…' : 'Log In'}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-ink/60">
        New to Legal Care India?{' '}
        <a href="/register" className="font-medium text-primary hover:underline">
          Register as an Advocate
        </a>
      </p>
    </form>
  );
}
