'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogIn } from 'lucide-react';
import { Button, FormField, Input } from '@/components/ui';

/**
 * AdminLogin — the login screen shown by the /admin layout when there's no
 * valid admin session. On success it refreshes so the layout re-renders the
 * panel.
 */
export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Login failed. Please try again.');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <div className="w-full rounded-2xl border border-ink/8 bg-surface p-7 shadow-card">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Admin Login</h1>
        <p className="mt-1 text-sm text-ink/55">Sign in to access the Legal Care India admin panel.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <FormField label="Email" htmlFor="admin-email">
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              autoComplete="username"
            />
          </FormField>
          <FormField label="Password" htmlFor="admin-password">
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </FormField>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" fullWidth disabled={loading} leftIcon={<LogIn className="h-4 w-4" />}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}
