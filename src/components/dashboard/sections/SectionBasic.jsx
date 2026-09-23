'use client';

import { useState } from 'react';
import { UserRound, Upload, X, ImageIcon, Sparkles, Loader2, Lock } from 'lucide-react';
import { FormField, Input, Select, Avatar } from '@/components/ui';
import { CITIES } from '@/data/cities';
import { STATES, allCitiesForState } from '@/data/indiaLocations';
import { fileToResizedDataURL } from '@/utils/imageFile';
import { activePlan } from '@/constants/membershipPlans';
import DashboardSection from '../DashboardSection';
import PlanUpgradeModal from '../PlanUpgradeModal';
import SmartImage from '@/components/shared/SmartImage';

/**
 * SectionBasic — photo, cover, tagline, and (in the full editor) identity.
 *
 * `identity` is what makes this usable in two places. The guided setup already
 * takes a lawyer's name and city on its first step — that step is what creates
 * the account — so asking for them again three steps later is the same
 * question twice, and a lawyer who answers differently the second time has no
 * way of knowing which one their profile kept. With `identity={false}` this
 * section is only what the name of its step promises: how you appear.
 *
 * The full editor keeps them. A name or a city does change, and there has to
 * be somewhere to change it.
 *
 * `cities` merges the built-in list with admin-added cities; it falls back to
 * the built-ins when the prop isn't supplied.
 *
 * `showErrors` turns on the red state for the tagline once the lawyer has
 * tried to move on without it — see EditProfileForm / ProfileSetupStepper for
 * when that flips true. Before that a blank tagline is just an empty box, not
 * a mistake being pointed at.
 */
export default function SectionBasic({ data, set, cities = CITIES, identity = true, showErrors = false }) {
  const [error, setError] = useState('');
  const taglineMissing = showErrors && !String(data.tagline || '').trim();

  // Suggestions for whichever state is selected, plus any city an admin added.
  const cityOptions = allCitiesForState(data.state, cities);

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
      title={identity ? 'Basic Details' : 'Photo & Headline'}
      description={
        identity
          ? 'Your identity as shown at the top of your public profile.'
          : 'The picture and the one line clients see at the top of your profile.'
      }
      icon={UserRound}
    >
      {/* Cover preview */}
      <div className="relative mb-4 h-32 overflow-hidden rounded-xl border border-ink/10 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20">
        {data.coverImage && (
          <SmartImage src={data.coverImage} alt="Cover" sizes="100vw" className="object-cover" />
        )}
        <div className="absolute right-2 top-2 flex gap-2">
          <UploadButton label="Upload Cover" icon={ImageIcon} onFile={handleCover} solid />
          {data.coverImage && (
            <RemoveButton label="Remove cover" onClick={() => set('coverImage', '')} />
          )}
        </div>
      </div>
      <p className="mb-6 text-xs text-ink/45">
        Recommended 1600×500px (a wide banner), landscape. JPG or PNG, up to 10MB — resized automatically.
      </p>

      {/* Photo */}
      <div className="mb-2 flex flex-wrap items-center gap-4">
        <Avatar src={data.photo} name={data.fullName} size="lg" />
        <div className="flex flex-wrap items-center gap-2">
          <UploadButton label="Upload Photo" icon={Upload} onFile={handlePhoto} />
          <AiAvatarButton data={data} set={set} />
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
      <p className="mb-6 text-xs text-ink/45">Square, at least 512×512px. JPG or PNG, up to 10MB — resized automatically.</p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-2">
        {identity && (
          <FormField label="Full Name" htmlFor="d-name" className="sm:col-span-2">
            <Input id="d-name" value={data.fullName} onChange={(e) => set('fullName', e.target.value)} />
          </FormField>
        )}

        <FormField
          label="Headline / Tagline"
          htmlFor="d-tagline"
          required
          className="sm:col-span-2"
          hint={taglineMissing ? '' : 'One line under your name — what you do, in a few words.'}
          error={taglineMissing ? 'Add a headline before saving — it is what clients see under your name.' : ''}
        >
          <Input
            id="d-tagline"
            invalid={taglineMissing}
            value={data.tagline}
            onChange={(e) => set('tagline', e.target.value)}
            placeholder="Criminal defence and bail matters"
          />
        </FormField>

        {identity && (
          <>
            {/* Suggestions, not a closed list — the same reason registration
                takes a typed city: the built-in list is a few dozen per state
                against India's several thousand towns, and a lawyer whose town
                is missing was being asked to claim one they don't practise in. */}
            <FormField label="City" htmlFor="d-city" hint="Pick from the list or type your own.">
              <Input
                id="d-city"
                list="d-city-options"
                value={data.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="Start typing your city"
                autoComplete="off"
              />
              <datalist id="d-city-options">
                {cityOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </FormField>
            <FormField label="State" htmlFor="d-state">
              <Select id="d-state" value={data.state} onChange={(e) => set('state', e.target.value)} options={STATES} />
            </FormField>
          </>
        )}
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

/**
 * "Create with AI" — a profile-photo avatar generated on the spot, for
 * Professional and Premium lawyers only. Starter sees the same button, locked,
 * and tapping it opens the plans rather than doing nothing unexplained.
 *
 * Capped at MAX_AI_AVATARS tries per lawyer (the server holds the real limit;
 * `data.aiAvatarRemaining` is only what the button shows before the first
 * press). A generated image is not saved on its own — it lands in the photo
 * slot exactly like an upload, and Save is still what keeps it.
 */
function AiAvatarButton({ data, set }) {
  const [remaining, setRemaining] = useState(data.aiAvatarRemaining ?? 2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPlans, setShowPlans] = useState(false);

  const plan = activePlan(data);
  const locked = plan.id === 'free';
  const exhausted = !locked && remaining <= 0;

  const generate = async () => {
    if (locked) {
      setShowPlans(true);
      return;
    }
    if (exhausted || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/avatar/generate', { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 402) {
          setShowPlans(true);
        } else {
          setError(payload.error || 'Could not create an avatar just now.');
          if (typeof payload.remaining === 'number') setRemaining(payload.remaining);
        }
        return;
      }
      set('photo', payload.photo);
      setRemaining(payload.remaining ?? Math.max(0, remaining - 1));
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={generate}
        disabled={busy || (!locked && exhausted)}
        title={
          locked
            ? 'AI avatars are for Professional and Premium plans'
            : exhausted
              ? 'You have used both of your AI avatar tries'
              : undefined
        }
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : locked || exhausted ? (
          <Lock className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {busy ? 'Creating…' : locked ? 'Create with AI' : exhausted ? 'No AI tries left' : `Create with AI (${remaining} left)`}
      </button>
      {error && <p className="mt-1.5 w-full text-xs text-red-600">{error}</p>}

      <PlanUpgradeModal
        open={showPlans}
        onClose={() => setShowPlans(false)}
        currentPlan={plan}
        blocked="AI avatar creation"
        suggest="professional"
        onUpgraded={(result) => {
          set('planId', result.planId);
          set('planExpiresAt', result.expiresAt || null);
          setShowPlans(false);
        }}
      />
    </>
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
