'use client';

import { useState } from 'react';
import { Save, Eye, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import SectionBasic from './sections/SectionBasic';
import SectionAboutServices from './sections/SectionAboutServices';
import SectionExperienceEducation from './sections/SectionExperienceEducation';
import SectionOfficeTiming from './sections/SectionOfficeTiming';
import SectionContactFees from './sections/SectionContactFees';
import SectionCredentials from './sections/SectionCredentials';
import SectionGallerySocial from './sections/SectionGallerySocial';

/**
 * EditProfileForm — client container holding the full editable profile state,
 * seeded from the advocate snapshot passed by the server page.
 * UI only: "Save" flips a saved indicator (no backend).
 *
 * @param {object} props
 * @param {object} props.initial  flat editable snapshot
 * @param {string} props.previewHref
 */
export default function EditProfileForm({ initial, previewHref }) {
  const [data, setData] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not save changes. Please try again.');
        return;
      }
      setSaved(true);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SectionBasic data={data} set={set} />
      <SectionAboutServices data={data} set={set} />
      <SectionExperienceEducation data={data} set={set} />
      <SectionOfficeTiming data={data} set={set} />
      <SectionContactFees data={data} set={set} />
      <SectionCredentials data={data} set={set} />
      <SectionGallerySocial data={data} set={set} />

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-ink/8 bg-surface/95 p-4 shadow-card-hover backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-sm">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : saved ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              <span className="text-ink/60">All changes saved.</span>
            </>
          ) : (
            <span className="text-ink/50">You have unsaved changes.</span>
          )}
        </span>
        <div className="flex gap-2">
          <Button
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            leftIcon={<Eye className="h-4 w-4" />}
          >
            Preview
          </Button>
          <Button type="submit" disabled={saving} leftIcon={<Save className="h-4 w-4" />}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
