'use client';

import { useState } from 'react';
import { UserRound, Upload, X, ImageIcon } from 'lucide-react';
import { FormField, Input, Select, Avatar } from '@/components/ui';
import { CITIES } from '@/data/cities';
import { STATES } from '@/data/languages';
import { fileToResizedDataURL } from '@/utils/imageFile';
import DashboardSection from '../DashboardSection';

/**
 * SectionBasic — photo/cover, name, tagline and location.
 *
 * `cities` merges the built-in list with admin-added cities; it falls back to
 * the built-ins when the prop isn't supplied.
 */
export default function SectionBasic({ data, set, cities = CITIES }) {
  const [error, setError] = useState('');

  const handlePhoto = async (file) => {
    try {
      setError('');
      set('photo', await fileToResizedDataURL(file, { maxDim: 512 }));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCover = async (file) => {
    try {
      setError('');
      set('coverImage', await fileToResizedDataURL(file, { maxDim: 1600, quality: 0.8 }));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <DashboardSection
      id="basic"
      title="Basic Details"
      description="Your identity as shown at the top of your public profile."
      icon={UserRound}
    >
      {/* Cover preview */}
      <div className="relative mb-4 h-32 overflow-hidden rounded-xl border border-ink/10 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20">
        {data.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.coverImage}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute right-2 top-2 flex gap-2">
          <UploadButton label="Upload Cover" icon={ImageIcon} onFile={handleCover} solid />
          {data.coverImage && (
            <RemoveButton label="Remove cover" onClick={() => set('coverImage', '')} />
          )}
        </div>
      </div>

      {/* Photo */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar src={data.photo} name={data.fullName} size="lg" />
        <div className="flex flex-wrap items-center gap-2">
          <UploadButton label="Upload Photo" icon={Upload} onFile={handlePhoto} />
          {data.photo && (
            <button
              type="button"
              onClick={() => set('photo', '')}
              className="text-sm font-medium text-red-500 hover:text-red-600"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Full Name" htmlFor="d-name" className="sm:col-span-2">
          <Input id="d-name" value={data.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </FormField>
        <FormField label="Headline / Tagline" htmlFor="d-tagline" className="sm:col-span-2">
          <Input id="d-tagline" value={data.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </FormField>
        <FormField label="City" htmlFor="d-city">
          <Select id="d-city" value={data.city} onChange={(e) => set('city', e.target.value)}>
            {cities.map((c) => (
              <option key={c.slug} value={c.name}>{c.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="State" htmlFor="d-state">
          <Select id="d-state" value={data.state} onChange={(e) => set('state', e.target.value)} options={STATES} />
        </FormField>
      </div>
    </DashboardSection>
  );
}

function UploadButton({ label, icon: Icon = Upload, onFile, solid = false }) {
  return (
    <label
      className={
        solid
          ? 'inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-ink/70 shadow-sm backdrop-blur hover:text-primary'
          : 'inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-ink/20 px-4 py-2 text-sm font-medium text-ink/60 hover:border-primary/40 hover:text-primary'
      }
    >
      <Icon className="h-4 w-4" />
      {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </label>
  );
}

function RemoveButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1.5 text-xs font-medium text-red-500 shadow-sm backdrop-blur hover:text-red-600"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
