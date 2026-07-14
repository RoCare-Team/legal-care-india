'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, MapPin, Trash2, ExternalLink, CheckCircle2, Lock, Upload, ImageIcon, X, Loader2 } from 'lucide-react';
import { Button, FormField, Input, Select } from '@/components/ui';
import { STATES, citiesForState } from '@/data/indiaLocations';

/**
 * CitiesManager — admin UI to add a new city (which creates a /cities/[slug]
 * page) and to see/remove admin-added cities.
 *
 * @param {object} props
 * @param {Array} props.cities  merged list (built-in + custom), each with a `custom` flag
 */
export default function CitiesManager({ cities }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [advocates, setAdvocates] = useState('');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not upload the image.');
        return;
      }
      setImage(payload.url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    if (name.trim().length < 2) return setError('Please enter the city name.');
    if (state.trim().length < 2) return setError('Please enter the state.');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, state, advocates, image }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not add the city.');
        return;
      }
      setOk(payload.message || 'City added.');
      setName('');
      setState('');
      setAdvocates('');
      setImage('');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (slug, cityName) => {
    if (!window.confirm(`Remove "${cityName}"? Its page will stop working.`)) return;
    setDeleting(slug);
    try {
      const res = await fetch(`/api/admin/cities?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } finally {
      setDeleting('');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      {/* Add form */}
      <div className="h-fit rounded-2xl border border-ink/8 bg-surface p-5 shadow-card lg:sticky lg:top-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="font-display text-lg font-semibold text-ink">Add a city</h3>
        </div>
        <p className="mt-1 text-sm text-ink/55">Creates a new /cities page for the site.</p>

        <form onSubmit={add} className="mt-4 space-y-4">
          <FormField label="State" htmlFor="c-state">
            <Select
              id="c-state"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setName(''); // reset city when the state changes
              }}
              placeholder="Select a state"
              options={STATES}
            />
          </FormField>
          <FormField label="City name" htmlFor="c-name">
            <Select
              id="c-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={state ? 'Select a city' : 'Choose a state first'}
              options={citiesForState(state)}
              disabled={!state}
            />
          </FormField>
          <FormField label="Advocates count (optional)" htmlFor="c-adv">
            <Input id="c-adv" type="number" min="0" value={advocates} onChange={(e) => setAdvocates(e.target.value)} placeholder="e.g. 1200" />
          </FormField>
          <FormField label="City image (optional)" htmlFor="c-img">
            {image ? (
              <div className="relative overflow-hidden rounded-xl border border-ink/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="City preview" className="h-28 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImage('')}
                  aria-label="Remove image"
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-ink/60 text-white backdrop-blur hover:bg-ink/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="c-img"
                className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink/20 bg-ink/[0.02] px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/[0.03]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
                    <span className="text-sm font-medium text-ink/60">Uploading…</span>
                  </>
                ) : (
                  <>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                      <Upload className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-ink/70">Choose image from your computer</span>
                    <span className="flex items-center gap-1 text-[11px] text-ink/40">
                      <ImageIcon className="h-3 w-3" aria-hidden="true" />
                      JPG, PNG, WebP · max 5 MB
                    </span>
                  </>
                )}
                <input
                  id="c-img"
                  type="file"
                  accept="image/*"
                  onChange={onFile}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </FormField>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {ok && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {ok}
            </p>
          )}

          <Button type="submit" fullWidth disabled={saving || uploading} leftIcon={<Plus className="h-4 w-4" />}>
            {saving ? 'Adding…' : 'Add city'}
          </Button>
        </form>
      </div>

      {/* Existing cities */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/40">
          All cities ({cities.length})
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cities.map((c) => (
            <div key={c.slug} className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-surface p-4 shadow-card">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-ink">{c.name}</p>
                  {c.custom ? (
                    <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Added</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink/6 px-2 py-0.5 text-[10px] font-semibold text-ink/45">
                      <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                      Built-in
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-ink/50">
                  {c.state} · {c.advocates || 0} advocates
                </p>
              </div>
              <Link
                href={`/${c.slug}`}
                target="_blank"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/40 hover:bg-ink/5 hover:text-primary"
                aria-label={`Open ${c.name} page`}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
              {c.custom && (
                <button
                  type="button"
                  onClick={() => remove(c.slug, c.name)}
                  disabled={deleting === c.slug}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/40 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                  aria-label={`Remove ${c.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
