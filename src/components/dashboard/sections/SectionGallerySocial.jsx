'use client';

import { useState } from 'react';
import { Image as ImageIcon, Share2, Plus, X, Linkedin, Globe, Facebook, Twitter } from 'lucide-react';
import { FormField, Input } from '@/components/ui';
import { fileToResizedDataURL } from '@/utils/imageFile';
import DashboardSection from '../DashboardSection';

const MAX_PHOTOS = 6;

/**
 * SectionGallerySocial — office photo uploads and social links.
 */
export default function SectionGallerySocial({ data, set }) {
  const [error, setError] = useState('');
  const gallery = (data.gallery || []).filter(Boolean);
  const setSocial = (key) => (e) => set('social', { ...data.social, [key]: e.target.value });

  const addPhoto = async (file) => {
    try {
      setError('');
      if (gallery.length >= MAX_PHOTOS) {
        setError(`You can upload up to ${MAX_PHOTOS} photos.`);
        return;
      }
      const url = await fileToResizedDataURL(file, { maxDim: 1200, quality: 0.8 });
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `g-${gallery.length}-${url.length}`;
      set('gallery', [...gallery, { id, url, label: '' }]);
    } catch (e) {
      setError(e.message);
    }
  };

  const removePhoto = (i) => {
    set('gallery', gallery.filter((_, idx) => idx !== i));
  };

  const emptySlots = Math.max(0, MAX_PHOTOS - gallery.length);

  return (
    <>
      <DashboardSection id="gallery" title="Office Gallery" description={`Upload photos of your office (up to ${MAX_PHOTOS}).`} icon={ImageIcon}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((img, i) => (
            <figure key={img.id || i} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-ink/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={`Office photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Remove photo"
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </figure>
          ))}

          {emptySlots > 0 && (
            <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-xl border border-dashed border-ink/20 text-ink/40 hover:border-primary/40 hover:text-primary">
              <span className="flex flex-col items-center gap-1 text-xs font-medium">
                <Plus className="h-6 w-6" />
                Add photo
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) addPhoto(file);
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </DashboardSection>

      <DashboardSection id="social" title="Social Links" description="Optional links shown on your profile." icon={Share2}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="LinkedIn">
            <Input value={data.social.linkedin} onChange={setSocial('linkedin')} leftIcon={<Linkedin className="h-4 w-4" />} placeholder="https://linkedin.com/in/…" />
          </FormField>
          <FormField label="Website">
            <Input value={data.social.website} onChange={setSocial('website')} leftIcon={<Globe className="h-4 w-4" />} placeholder="https://…" />
          </FormField>
          <FormField label="Facebook">
            <Input value={data.social.facebook} onChange={setSocial('facebook')} leftIcon={<Facebook className="h-4 w-4" />} placeholder="https://facebook.com/…" />
          </FormField>
          <FormField label="Twitter / X">
            <Input value={data.social.twitter} onChange={setSocial('twitter')} leftIcon={<Twitter className="h-4 w-4" />} placeholder="https://x.com/…" />
          </FormField>
        </div>
      </DashboardSection>
    </>
  );
}
