'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, BadgeCheck } from 'lucide-react';
import DataTable, { AdminAvatar } from '@/components/admin/DataTable';
import { SearchBox, FilterSelect } from '@/components/admin/TableControls';
import { formatDate } from '@/utils/formatters';

function StatusBadge({ status }) {
  const map = {
    published: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/20',
    pending: 'bg-amber-500/12 text-amber-700 ring-amber-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ${map[status] || 'bg-ink/8 text-ink/55 ring-ink/10'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

/**
 * AdvocatesTable — client-side searchable/filterable advocates table.
 *
 * @param {object} props
 * @param {Array} props.advocates
 */
export default function AdvocatesTable({ advocates }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [state, setState] = useState('all');
  const [field, setField] = useState('all');

  const states = useMemo(
    () => [...new Set(advocates.map((a) => a.state).filter(Boolean))].sort(),
    [advocates]
  );

  // Every unique practice area (specialization) across all advocates.
  const fields = useMemo(
    () => [...new Set(advocates.flatMap((a) => a.specializations || []).filter(Boolean))].sort(),
    [advocates]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return advocates.filter((a) => {
      if (status !== 'all' && a.status !== status) return false;
      if (state !== 'all' && a.state !== state) return false;
      if (field !== 'all' && !(a.specializations || []).includes(field)) return false;
      if (term) {
        const hay = [a.name, a.email, a.phone, a.legalCareId, a.city, a.state, ...(a.specializations || [])]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [advocates, q, status, state, field]);

  const active = q || status !== 'all' || state !== 'all' || field !== 'all';

  const columns = [
    {
      key: 'name',
      label: 'Advocate',
      render: (a) => (
        <div className="flex items-center gap-3">
          <AdminAvatar name={a.name} />
          <div className="min-w-0">
            <Link
              href={`/advocates/${a.slug}-${a.legalCareId.toLowerCase()}`}
              target="_blank"
              className="flex items-center gap-1 font-semibold text-ink hover:text-primary"
            >
              {a.name}
              {a.verified && <BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" />}
            </Link>
            <p className="font-mono text-[11px] text-ink/40">{a.legalCareId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (a) => (
        <div className="space-y-1 text-xs">
          <p className="flex items-center gap-1.5 text-ink/75">
            <Mail className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
            {a.email}
          </p>
          <p className="flex items-center gap-1.5 text-ink/55">
            <Phone className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
            {a.phone || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (a) => {
        const loc = [a.city, a.state].filter(Boolean).join(', ');
        return loc ? (
          <span className="flex items-center gap-1.5 text-ink/70">
            <MapPin className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
            {loc}
          </span>
        ) : (
          <span className="text-ink/30">—</span>
        );
      },
    },
    {
      key: 'specializations',
      label: 'Practice',
      render: (a) =>
        a.specializations.length ? (
          <div className="flex flex-wrap gap-1">
            {a.specializations.slice(0, 2).map((s) => (
              <span key={s} className="rounded-md bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary/90">
                {s}
              </span>
            ))}
            {a.specializations.length > 2 && (
              <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/50">
                +{a.specializations.length - 2}
              </span>
            )}
          </div>
        ) : (
          <span className="text-ink/30">—</span>
        ),
    },
    {
      key: 'consultationFee',
      label: 'Fee',
      render: (a) =>
        a.consultationFee ? <span className="font-semibold text-ink">₹{a.consultationFee}</span> : <span className="text-ink/30">—</span>,
    },
    { key: 'status', label: 'Status', render: (a) => <StatusBadge status={a.status} /> },
    { key: 'createdAt', label: 'Joined', render: (a) => <span className="whitespace-nowrap text-ink/60">{formatDate(a.createdAt)}</span> },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email, phone, ID…" />
        <FilterSelect
          value={status}
          onChange={setStatus}
          label="Status"
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'published', label: 'Published' },
            { value: 'pending', label: 'Pending' },
          ]}
        />
        <FilterSelect
          value={state}
          onChange={setState}
          label="State"
          options={[{ value: 'all', label: 'All states' }, ...states.map((s) => ({ value: s, label: s }))]}
        />
        <FilterSelect
          value={field}
          onChange={setField}
          label="Practice area"
          options={[{ value: 'all', label: 'All fields' }, ...fields.map((f) => ({ value: f, label: f }))]}
        />
        <span className="ml-auto text-sm text-ink/50">
          {filtered.length} of {advocates.length}
        </span>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        empty={active ? 'No advocates match your search or filters.' : 'No advocates registered yet.'}
      />
    </div>
  );
}
