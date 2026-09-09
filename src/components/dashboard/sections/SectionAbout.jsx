'use client';

import { useState } from 'react';
import { AlignLeft, Sparkles, Loader2, RotateCw, Check } from 'lucide-react';
import { FormField, Textarea } from '@/components/ui';
import DashboardSection from '../DashboardSection';

/**
 * The "About" paragraph, and a way to have it written.
 *
 * Deliberately the last thing a lawyer is asked for. It is the hardest field
 * on the form — a blank box asking a busy advocate to describe themselves is
 * where profiles get abandoned — and it is the one field that can be drafted
 * from everything else. Asked first it is an obstacle; asked last it is a
 * summary of answers already given.
 *
 * The draft comes from the lawyer's own record: their practice areas, matters,
 * courts, city, years and education. It is never saved on their behalf — it
 * lands in the box for them to read, cut and correct, because it is written in
 * their voice about their practice and they are the one answerable for it.
 *
 * @param {object} props
 * @param {object} props.data  the editable snapshot
 * @param {(field: string, value: any) => void} props.set
 */
export default function SectionAbout({ data, set }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drafted, setDrafted] = useState(false);

  const existing = String(data.about || '');
  // What the draft would be built from. With none of it there is nothing to
  // summarise, and a paragraph invented out of a name is exactly the kind of
  // plausible fiction a public profile must not carry.
  const enough =
    (data.services || []).length > 0 && String(data.city || '').trim().length > 0;

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/about/generate', { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not write a draft just now.');
        return;
      }
      set('about', payload.about || '');
      setDrafted(true);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardSection
      id="about"
      title="About"
      description="A short paragraph clients read before they call. Write it yourself, or let us draft one from what you have already filled in."
      icon={AlignLeft}
    >
      <div className="mb-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Write it for me
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink/55">
              {enough
                ? 'Uses only what is on your profile — your practice areas, matters, courts, city and experience. Nothing is invented, and nothing is saved until you save it.'
                : 'Add at least one practice area and your city first — there is nothing to summarise yet.'}
            </p>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={busy || !enough}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : existing ? (
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {busy ? 'Writing…' : existing ? 'Rewrite' : 'Draft it for me'}
          </button>
        </div>

        {error && <p className="mt-2 text-[12.5px] font-medium text-rose-700">{error}</p>}

        {drafted && !error && (
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-700">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Draft ready — read it over and change anything that is not right.
          </p>
        )}
      </div>

      <FormField
        label="About You"
        htmlFor="d-about"
        hint={`${existing.length} characters`}
      >
        <Textarea
          id="d-about"
          rows={8}
          value={existing}
          onChange={(e) => {
            set('about', e.target.value);
            setDrafted(false);
          }}
          placeholder="What you practise, who you help, and how you work with clients."
        />
      </FormField>
    </DashboardSection>
  );
}
