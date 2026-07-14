import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Mail, User, MapPin } from 'lucide-react';
import DeleteAccount from '@/components/dashboard/DeleteAccount';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById } from '@/lib/advocates';

export const metadata = {
  title: 'Account Settings | Legal Care India',
  robots: { index: false, follow: false },
};

/** A single read-only account detail row. */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/40">{label}</p>
        <p className="truncate text-sm font-medium text-ink">{value || '—'}</p>
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');
  const advocate = await getAdvocateById(id);
  if (!advocate) redirect('/login');

  const location = [advocate.city, advocate.state].filter(Boolean).join(', ');

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Account Settings</h1>
        <p className="mt-1 text-sm text-ink/55">
          Manage your account details and account status.
        </p>
      </div>

      {/* Account overview */}
      <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Account details</h2>
        <div className="mt-2 divide-y divide-ink/8">
          <InfoRow icon={User} label="Name" value={advocate.name} />
          <InfoRow icon={Mail} label="Login email" value={advocate.email || advocate.contact?.email} />
          <InfoRow icon={MapPin} label="Location" value={location} />
        </div>
        <p className="mt-4 text-xs text-ink/45">
          To edit these, go to{' '}
          <Link href="/dashboard/profile" className="font-medium text-primary hover:underline">
            Edit Profile
          </Link>
          .
        </p>
      </div>

      {/* Danger zone */}
      <div className="mt-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-red-600/70">
          Danger Zone
        </h2>
        <DeleteAccount />
      </div>
    </div>
  );
}
