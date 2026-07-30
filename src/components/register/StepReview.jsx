'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Camera, Trash2 } from 'lucide-react';
import { Badge, Avatar } from '@/components/ui';
import { fileToResizedDataURL } from '@/utils/imageFile';

/**
 * StepReview — profile photograph, summary of everything entered, and terms
 * acceptance (final step).
 *
 * The photograph is asked for here rather than on the first step so nothing
 * stands between a visitor and starting the form, and because this is where the
 * lawyer is already checking how their profile will read. It stays optional —
 * nobody should be blocked from registering for want of a picture; the card
 * falls back to their initial and they can add one later from the dashboard.
 *
 * @param {object} props
 * @param {object} props.data
 * @param {(field:string,value:any)=>void} props.set
 * @param {Record<string,string>} props.errors
 */
export default function StepReview({ data, set, errors }) {
  const [photoError, setPhotoError] = useState('');

  /**
   * Downscaled in the browser before it ever reaches the server (see
   * utils/imageFile) — a 4MB phone photograph would otherwise be stored whole
   * and shipped to every visitor who sees this lawyer's card.
   */
  const handlePhoto = async (file) => {
    if (!file) return;
    try {
      setPhotoError('');
      set('photo', await fileToResizedDataURL(file, { maxDim: 512 }));
    } catch (e) {
      setPhotoError(e.message);
    }
  };

  const rows = [
    ['Name', data.fullName],
    ['Email', data.email],
    ['Mobile', data.phone],
    ['Bar Council No.', data.barCouncil],
    ['Experience', data.experience ? `${data.experience} years` : ''],
    ['Location', [data.city, data.state].filter(Boolean).join(', ')],
    ['Office', data.officeName],
  ];

  return (
    <div className="space-y-6">
      {/* ── Profile photograph ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-ink/8 bg-muted/40 p-5">
        <p className="text-sm font-medium text-ink">
          Profile Photo
          <span className="ml-2 font-normal text-ink/45">optional</span>
        </p>

        <div className="mt-3.5 flex flex-wrap items-center gap-4">
          <Avatar
            src={data.photo}
            name={data.fullName || 'A'}
            size="lg"
            className="!h-20 !w-20 !rounded-2xl ring-1 ring-ink/10"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
                <Camera className="h-4 w-4" aria-hidden="true" />
                {data.photo ? 'Change photo' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handlePhoto(e.target.files?.[0])}
                />
              </label>

              {data.photo && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoError('');
                    set('photo', '');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-ink/12 px-3.5 py-2.5 text-sm font-semibold text-ink/60 transition-colors hover:border-rose-300 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>

            <p className="mt-2 text-xs leading-relaxed text-ink/50">
              {data.photo
                ? 'This is how your photo will appear on your profile and in listings.'
                : 'A clear, front-facing photograph. Clients are far likelier to open a profile that has one — you can also add it later from your dashboard.'}
            </p>
            {photoError && (
              <p className="mt-1.5 text-xs font-medium text-rose-600">{photoError}</p>
            )}
          </div>
        </div>
      </div>

      <dl className="grid gap-x-6 gap-y-4 rounded-xl border border-ink/8 bg-muted/40 p-5 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-ink/45">{label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink/85">{value || '—'}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="mb-2 text-xs text-ink/45">Legal Services</p>
        <div className="flex flex-wrap gap-1.5">
          {(data.services || []).map((s) => (
            <Badge key={s} variant="primary" size="sm">{s}</Badge>
          ))}
          {(data.languages || []).map((l) => (
            <Badge key={l} variant="secondary" size="sm">{l}</Badge>
          ))}
        </div>
      </div>

      {(data.subServices || []).length > 0 && (
        <div>
          <p className="mb-2 text-xs text-ink/45">Specific Areas</p>
          <div className="flex flex-wrap gap-1.5">
            {data.subServices.map((s) => (
              <Badge key={s} variant="neutral" size="sm">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {(data.courts || []).length > 0 && (
        <div>
          <p className="mb-2 text-xs text-ink/45">Courts</p>
          <div className="flex flex-wrap gap-1.5">
            {data.courts.map((c) => (
              <Badge key={c} variant="primary" size="sm">{c}</Badge>
            ))}
          </div>
        </div>
      )}

      {(data.practiceCities || []).length > 0 && (
        <div>
          <p className="mb-2 text-xs text-ink/45">Cities You Work In</p>
          <div className="flex flex-wrap gap-1.5">
            {data.practiceCities.map((c) => (
              <Badge key={c} variant="secondary" size="sm">{c}</Badge>
            ))}
          </div>
        </div>
      )}

      {(data.consultationPlans || []).filter((p) => p.minutes && p.price).length > 0 && (
        <div>
          <p className="mb-2 text-xs text-ink/45">Live Chat Plans</p>
          <div className="flex flex-wrap gap-1.5">
            {data.consultationPlans
              .filter((p) => p.minutes && p.price)
              .map((p, i) => (
                <Badge key={i} variant="neutral" size="sm">{p.minutes} min · ₹{p.price}</Badge>
              ))}
          </div>
        </div>
      )}

      <label className="flex items-start gap-3 rounded-xl border border-ink/8 p-4">
        <input
          type="checkbox"
          checked={data.terms}
          onChange={(e) => set('terms', e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-ink/30 text-primary focus:ring-primary/40"
        />
        <span className="text-sm text-ink/70">
          I confirm the information provided is accurate and I agree to the{' '}
          <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
        </span>
      </label>
      {errors.terms && <p className="-mt-3 text-xs text-red-600">{errors.terms}</p>}
    </div>
  );
}
