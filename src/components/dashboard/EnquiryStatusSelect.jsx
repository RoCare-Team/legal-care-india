'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { ADVOCATE_STATUS_OPTIONS, ADVOCATE_STATUS_META } from '@/constants/enquiryStatus';

/**
 * EnquiryStatusSelect — lets the advocate set how they're handling an enquiry
 * (New / Pending / Confirmed / Declined). The chosen status is shown to the
 * client on their account page. Saves instantly via PATCH /api/enquiries/[id].
 *
 * @param {object} props
 * @param {string} props.id             enquiry id
 * @param {string} props.initialStatus  current status
 */
export default function EnquiryStatusSelect({ id, initialStatus = 'new' }) {
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const meta = ADVOCATE_STATUS_META[status] || ADVOCATE_STATUS_META.new;

  const onChange = async (e) => {
    const next = e.target.value;
    const prev = status;
    setStatus(next);
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setStatus(prev); // revert on failure
      setError('Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline ${meta.tone}`}>
        {meta.label}
      </span>
      <div className="relative">
        <select
          value={status}
          onChange={onChange}
          disabled={saving}
          aria-label="Enquiry status"
          className="cursor-pointer rounded-lg border border-ink/15 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-ink outline-none focus:border-primary disabled:opacity-60"
        >
          {ADVOCATE_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink/40" aria-hidden="true" />}
      {saved && <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />}
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
