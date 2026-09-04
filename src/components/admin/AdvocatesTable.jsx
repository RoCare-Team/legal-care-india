'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Mail, MapPin, BadgeCheck, ExternalLink, ChevronRight, Check, EyeOff, Loader2, Trash2, ShieldCheck, ShieldOff, X } from 'lucide-react';
import DataTable, { AdminAvatar } from '@/components/admin/DataTable';
import ImpersonateButton from '@/components/admin/ImpersonateButton';
import { SearchBox, FilterSelect } from '@/components/admin/TableControls';
import { formatDate } from '@/utils/formatters';
import { advocateProfilePath } from '@/utils/advocateUrl';

/** Approve / unpublish control for a single lawyer row. */
function StatusAction({ advocate }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async (action) => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/advocates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: advocate.id, action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (busy) {
    return <Loader2 className="h-4 w-4 animate-spin text-ink/40" aria-hidden="true" />;
  }

  return advocate.status === 'pending' ? (
    <button
      type="button"
      onClick={() => run('approve')}
      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20"
    >
      <Check className="h-3.5 w-3.5" aria-hidden="true" />
      Approve
    </button>
  ) : (
    <button
      type="button"
      onClick={() => run('unpublish')}
      title="Take offline"
      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink/45 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
    >
      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
      Unpublish
    </button>
  );
}

/** Destructive delete, kept apart from the approval controls in its own column. */
function DeleteAction({ advocate }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!window.confirm(`Delete ${advocate.name}? This permanently removes their account and listing from the website.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/advocates?id=${advocate.id}`, { method: 'DELETE' });
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
      title="Delete lawyer"
      aria-label={`Delete ${advocate.name}`}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-rose-500 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

/**
 * The bar that appears once rows are ticked.
 *
 * Approving and verifying are deliberately two buttons, not one. Approving puts
 * a lawyer in the public directory; verifying is a claim that somebody checked
 * their Bar Council enrolment. They are usually done together and they are
 * still not the same statement, so the panel makes an admin say which one they
 * mean.
 *
 * @param {object} props
 * @param {string[]} props.ids            the ticked lawyers
 * @param {() => void} props.onClear
 * @param {() => void} props.onDone       refresh once the write lands
 */
function BulkBar({ ids, onClear, onDone }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  // The approval can succeed while its email does not. That is not an error —
  // nothing needs retrying — but it is not a clean green tick either.
  const [warn, setWarn] = useState(false);

  const run = async (action, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(action);
    setError('');
    setDone('');
    setWarn(false);
    try {
      const res = await fetch('/api/admin/advocates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not update those lawyers.');
        return;
      }

      // Say what actually moved, not how many were selected. Ticking fifteen
      // and being told "15 published" when fourteen already were reads as work
      // that did not happen.
      const changed = Number(data.changed ?? 0);
      const verb = {
        approve: 'published',
        unpublish: 'unpublished',
        verify: 'marked verified',
        unverify: 'had the badge removed',
      }[action];

      let message =
        changed === 0
          ? `Nothing to do — all ${ids.length} were already ${verb === 'published' ? 'live' : verb}.`
          : `${changed} lawyer${changed === 1 ? '' : 's'} ${verb}.`;

      // The "profile is live" notices, reported apart from the approval
      // itself and apart from each other: the lawyers are published either
      // way, and an admin told only "15 published" would never learn that one
      // of the two channels silently did not go.
      const notices = [];
      for (const [channel, result] of [
        ['email', data.email],
        ['WhatsApp', data.whatsapp],
      ]) {
        if (!result) continue;
        if (result.sent > 0) {
          notices.push(`${result.sent} by ${channel}`);
        } else {
          notices.push(`no ${channel} (${result.error || 'unknown reason'})`);
          setWarn(true);
        }
      }
      if (notices.length) message += ` Notified: ${notices.join(', ')}.`;
      setDone(message);
      onDone();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy('');
    }
  };

  const Action = ({ action, icon: Icon, children, confirm, tone = 'text-ink/70 hover:bg-ink/5' }) => (
    <button
      type="button"
      disabled={Boolean(busy)}
      onClick={() => run(action, confirm)}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${tone}`}
    >
      {busy === action ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {children}
    </button>
  );

  return (
    <div className="mb-3 rounded-xl border border-primary/25 bg-primary/[0.04] px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-primary">
          {ids.length} selected
        </span>
        <span className="h-4 w-px bg-primary/20" aria-hidden="true" />

        <Action
          action="approve"
          icon={Check}
          tone="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
        >
          Publish
        </Action>
        <Action
          action="verify"
          icon={ShieldCheck}
          tone="bg-primary/10 text-primary hover:bg-primary/20"
        >
          Mark verified
        </Action>
        <Action
          action="unverify"
          icon={ShieldOff}
          confirm={`Remove the verified badge from ${ids.length} lawyer(s)?`}
        >
          Remove badge
        </Action>
        <Action
          action="unpublish"
          icon={EyeOff}
          confirm={`Take ${ids.length} lawyer(s) out of the public directory?`}
          tone="text-ink/60 hover:bg-rose-500/10 hover:text-rose-600"
        >
          Unpublish
        </Action>

        <button
          type="button"
          onClick={onClear}
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-ink/45 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
      {done && !error && (
        <p
          className={`mt-2 text-xs font-medium ${
            warn ? 'text-amber-700' : 'text-emerald-700'
          }`}
        >
          {done}
        </p>
      )}
    </div>
  );
}

/** A row's tick box, and the one in the header that takes the whole page. */
function Tick({ checked, indeterminate = false, onChange, label }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      ref={(el) => {
        // `indeterminate` is a DOM property, not an attribute — React cannot
        // set it from JSX, so the half-ticked "some of these" state has to be
        // written onto the node itself.
        if (el) el.indeterminate = indeterminate && !checked;
      }}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 cursor-pointer rounded border-ink/25 text-primary accent-[color:rgb(30_58_95)]"
    />
  );
}

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
 * AdvocatesTable — client-side searchable/filterable lawyers table.
 *
 * @param {object} props
 * @param {Array} props.advocates
 */
export default function AdvocatesTable({ advocates }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  // Separate from `status` on purpose: being listed and being verified are two
  // different facts, and filtering to "not verified yet" is exactly how an
  // admin finds the rows a bulk verify should cover.
  const [verification, setVerification] = useState('all');
  const [state, setState] = useState('all');
  const [field, setField] = useState('all');

  // Ticked lawyers, by id. Held as a Set of ids rather than of rows so that a
  // refresh — which hands us new objects for the same lawyers — does not lose
  // the selection.
  const [selected, setSelected] = useState(() => new Set());

  const states = useMemo(
    () => [...new Set(advocates.map((a) => a.state).filter(Boolean))].sort(),
    [advocates]
  );

  // Every unique practice area (specialization) across all lawyers.
  const fields = useMemo(
    () => [...new Set(advocates.flatMap((a) => a.specializations || []).filter(Boolean))].sort(),
    [advocates]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return advocates.filter((a) => {
      if (status !== 'all' && a.status !== status) return false;
      if (verification !== 'all' && a.verified !== (verification === 'verified')) return false;
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
  }, [advocates, q, status, verification, state, field]);

  const active =
    q || status !== 'all' || verification !== 'all' || state !== 'all' || field !== 'all';

  // Selection is scoped to what the filters are showing. "Select all" on a
  // page filtered to Pending has to mean those pending lawyers and nothing
  // else — a tick box that quietly also published the rows you had filtered
  // out would be the worst kind of bulk action.
  const visibleIds = useMemo(() => filtered.map((a) => a.id), [filtered]);
  const selectedVisible = useMemo(
    () => visibleIds.filter((id) => selected.has(id)),
    [visibleIds, selected]
  );
  const allVisibleTicked =
    visibleIds.length > 0 && selectedVisible.length === visibleIds.length;

  const toggleOne = (id, on) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleAllVisible = (on) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const columns = [
    {
      key: 'select',
      label: (
        <Tick
          checked={allVisibleTicked}
          indeterminate={selectedVisible.length > 0}
          onChange={toggleAllVisible}
          label={allVisibleTicked ? 'Clear selection' : 'Select all shown'}
        />
      ),
      className: 'w-10',
      render: (a) => (
        <Tick
          checked={selected.has(a.id)}
          onChange={(on) => toggleOne(a.id, on)}
          label={`Select ${a.name}`}
        />
      ),
    },
    {
      key: 'name',
      label: 'Lawyer',
      render: (a) => (
        <div className="flex items-center gap-3">
          <AdminAvatar name={a.name} />
          <div className="min-w-0">
            <Link
              href={`/admin/advocates/${a.id}`}
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
    { key: 'action', label: 'Approval', render: (a) => <StatusAction advocate={a} /> },
    { key: 'createdAt', label: 'Joined', render: (a) => <span className="whitespace-nowrap text-ink/60">{formatDate(a.createdAt)}</span> },
    { key: 'access', label: 'Access', render: (a) => <ImpersonateButton id={a.id} name={a.name} role="advocate" /> },
    {
      key: 'view',
      label: '',
      render: (a) => (
        <div className="flex items-center gap-2.5 whitespace-nowrap">
          <Link href={`/admin/advocates/${a.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary/70 hover:text-primary">
            View <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link
            // An unapproved profile 404s publicly, so send the admin to the
            // preview instead of a dead link.
            href={a.status === 'published' ? `/lawyers/${advocateProfilePath(a)}` : `/admin/advocates/${a.id}/preview`}
            target="_blank"
            title={a.status === 'published' ? 'Open public profile' : 'Preview (awaiting approval)'}
            className="text-ink/35 hover:text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      ),
    },
    {
      key: 'delete',
      label: '',
      className: 'text-right',
      render: (a) => (
        <div className="flex justify-end">
          <DeleteAction advocate={a} />
        </div>
      ),
    },
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
          value={verification}
          onChange={setVerification}
          label="Verification"
          options={[
            { value: 'all', label: 'All lawyers' },
            { value: 'verified', label: 'Verified' },
            { value: 'unverified', label: 'Not verified' },
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

      {selectedVisible.length > 0 && (
        <BulkBar
          ids={selectedVisible}
          onClear={() => setSelected(new Set())}
          onDone={() => router.refresh()}
        />
      )}

      <DataTable
        columns={columns}
        rows={filtered}
        empty={active ? 'No lawyers match your search or filters.' : 'No lawyers registered yet.'}
      />
    </div>
  );
}
