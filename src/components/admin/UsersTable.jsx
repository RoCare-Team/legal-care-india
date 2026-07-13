'use client';

import { useMemo, useState } from 'react';
import { Phone, Mail } from 'lucide-react';
import DataTable, { AdminAvatar } from '@/components/admin/DataTable';
import { SearchBox } from '@/components/admin/TableControls';
import { formatDate } from '@/utils/formatters';

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
        <div className="flex items-center gap-3">
          <AdminAvatar name={u.name} tone="bg-blue-500/10 text-blue-600" />
          <span className="font-semibold text-ink">{u.name}</span>
        </div>
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
