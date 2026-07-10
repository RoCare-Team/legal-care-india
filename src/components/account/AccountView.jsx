'use client';

import { Mail, Phone, MapPin, LogOut, Search } from 'lucide-react';
import { Avatar, Button } from '@/components/ui';
import { logout } from '@/utils/logout';

/**
 * AccountView — the logged-in client's simple account page.
 *
 * @param {object} props
 * @param {{ name: string, email: string, phone?: string, city?: string, photo?: string }} props.user
 */
export default function AccountView({ user }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar src={user.photo} name={user.name} size="lg" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-ink">{user.name}</h1>
            <p className="text-sm text-ink/55">Your Legal Care India account</p>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-ink/8 border-t border-ink/8">
          <Row icon={Mail} label="Email" value={user.email} />
          {user.phone && <Row icon={Phone} label="Mobile" value={user.phone} />}
          {user.city && <Row icon={MapPin} label="City" value={user.city} />}
        </dl>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button href="/advocates" leftIcon={<Search className="h-4 w-4" />} className="sm:flex-1">
            Find Advocates
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => logout('/')}
            leftIcon={<LogOut className="h-4 w-4" />}
            className="sm:flex-1"
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <dt className="w-24 shrink-0 text-sm text-ink/50">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-medium text-ink/80">{value}</dd>
    </div>
  );
}
