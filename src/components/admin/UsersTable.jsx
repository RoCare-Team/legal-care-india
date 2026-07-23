'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Mail, ChevronRight, Trash2, Loader2 } from 'lucide-react';
import DataTable, { AdminAvatar } from '@/components/admin/DataTable';
import ImpersonateButton from '@/components/admin/ImpersonateButton';
import { SearchBox } from '@/components/admin/TableControls';
import { formatDate } from '@/utils/formatters';

/** Destructive delete, in its own column away from the Login/View controls. */
function DeleteAction({ user }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!window.confirm(`Delete ${user.name}? This permanently removes their account. Their consultations and call history stay on record.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (busy) {
    return <Loader2 className="h-4 w-4 animate-spin text-rose-500" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={remove}
      title="Delete user"
      aria-label={`Delete ${user.name}`}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-rose-500 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

/**
 * UsersTable — client-side searchable/filterable users table.
 *
 * @param {object} props
 * @param {Array} props.users
 */
export default function UsersTable({ users }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => {
      const hay = [u.name, u.email, u.phone].join(' ').toLowerCase();
      return hay.includes(term);
    });
  }, [users, q]);

  const active = Boolean(q);

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (u) => (
        <Link href={`/admin/users/${u.id}`} className="group flex items-center gap-3">
          <AdminAvatar name={u.name} tone="bg-blue-500/10 text-blue-600" />
          <span className="font-semibold text-ink group-hover:text-primary">{u.name}</span>
        </Link>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (u) => (
        <span className="flex items-center gap-1.5 text-ink/70">
          <Mail className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
          {u.email}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (u) =>
        u.phone ? (
          <span className="flex items-center gap-1.5 text-ink/70">
            <Phone className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
            {u.phone}
          </span>
        ) : (
          <span className="text-ink/30">—</span>
        ),
    },
    { key: 'createdAt', label: 'Joined', render: (u) => <span className="whitespace-nowrap text-ink/60">{formatDate(u.createdAt)}</span> },
    { key: 'access', label: 'Access', render: (u) => <ImpersonateButton id={u.id} name={u.name} role="user" /> },
    {
      key: 'view',
      label: '',
      render: (u) => (
        <Link href={`/admin/users/${u.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary/70 hover:text-primary">
          View <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ),
    },
    {
      key: 'delete',
      label: '',
      className: 'w-px',
      render: (u) => <DeleteAction user={u} />,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email, phone…" />
        <span className="ml-auto text-sm text-ink/50">
          {filtered.length} of {users.length}
        </span>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        empty={active ? 'No users match your search or filters.' : 'No users registered yet.'}
      />
    </div>
  );
}
