'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, Lock, UserPlus } from 'lucide-react';
import { Button, FormField, Input } from '@/components/ui';
import { safeNextPath } from '@/utils/safeNext';

/**
 * UserSignupForm — client (user) registration card. Creates the account and
 * routes to the user account page (the API logs them in immediately).
 */
export default function UserSignupForm() {
  const [data, setData] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setData((p) => ({ ...p, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!data.name || !data.email || !data.password) {
      setError('Please fill in your name, email and password.');
      return;
    }
    if (data.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not create your account. Please try again.');
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
      <h1 className="font-display text-2xl font-semibold text-ink">Create Your Account</h1>
      <p className="mt-1 text-sm text-ink/55">
        Sign up to save lawyers and manage your enquiries — it&apos;s free.
      </p>

      <div className="mt-6 space-y-4">
        <FormField label="Full Name" htmlFor="user-signup-name">
          <Input
            id="user-signup-name"
            value={data.name}
            onChange={set('name')}
            placeholder="Your name"
            leftIcon={<User className="h-4 w-4" />}
          />
        </FormField>
        <FormField label="Email Address" htmlFor="user-signup-email">
          <Input
            id="user-signup-email"
            type="email"
            value={data.email}
            onChange={set('email')}
            placeholder="you@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
          />
        </FormField>
        <FormField label="Mobile Number (optional)" htmlFor="user-signup-phone">
          <Input
            id="user-signup-phone"
            type="tel"
            value={data.phone}
            onChange={set('phone')}
            placeholder="10-digit mobile"
            leftIcon={<Phone className="h-4 w-4" />}
          />
        </FormField>
        <FormField label="Password" htmlFor="user-signup-password">
          <Input
            id="user-signup-password"
            type="password"
            value={data.password}
            onChange={set('password')}
            placeholder="At least 8 characters"
            leftIcon={<Lock className="h-4 w-4" />}
          />
        </FormField>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <Button type="submit" fullWidth disabled={loading} leftIcon={<UserPlus className="h-4 w-4" />}>
          {loading ? 'Creating account…' : 'Sign Up'}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{' '}
        <Link href="/user/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-ink/50">
        Are you a lawyer?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Register as a lawyer
        </Link>
      </p>
    </form>
  );
}
