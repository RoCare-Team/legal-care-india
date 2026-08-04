'use client';

import { useEffect, useRef, useState } from 'react';
import { User, Mail, Phone, Lock, Camera, Trash2 } from 'lucide-react';
import { FormField, Input, Select, Avatar } from '@/components/ui';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import { LANGUAGES } from '@/data/languages';
import { STATES, allCitiesForState } from '@/data/indiaLocations';
import { CITIES } from '@/data/cities';
import { fileToResizedDataURL } from '@/utils/imageFile';
import FormSection from './FormSection';

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => String(v).replace(/\D/g, '').length >= 10;

/**
 * Ask the server whether an email or mobile is already registered, debounced.
 *
 * Finding out at the end of a five-step form that the email was taken means
 * walking all the way back to step one, so the answer is fetched while the
 * field is still on screen. Debounced because this fires on every keystroke,
 * and each stale reply is discarded — otherwise a slow response for a
 * half-typed address can land after a fast one for the finished address and
 * overwrite a correct verdict with a wrong one.
 *
 * @param {'email'|'phone'} field
 * @param {string} value
 * @param {(v:string)=>boolean} isComplete  is the value worth checking yet?
 * @returns {string} the error to show, or ''
 */
function useAvailability(field, value, isComplete) {
  const [taken, setTaken] = useState(false);
  // Bumped on every run; a reply whose ticket is stale is dropped.
  const ticket = useRef(0);

  useEffect(() => {
    const mine = (ticket.current += 1);
    setTaken(false);
    if (!isComplete(value)) return undefined;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/check-availability?${field}=${encodeURIComponent(value)}`
        );
        const payload = await res.json();
        if (mine === ticket.current) setTaken(Boolean(payload?.taken));
      } catch {
        // A failed check must not block registration — the server checks again
        // on submit, which is the one that actually decides.
      }
    }, 450);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field, value]);

  if (!taken) return '';
  return field === 'email'
    ? 'This email is already registered. Please log in instead.'
    : 'This mobile number is already registered.';
}

/**
 * StepPersonal — who the advocate is and where they are (step 1 of 5).
 *
 * Photograph, identity, login credentials and location. Everything a person can
 * answer without looking anything up, which is what a first step should ask.
 *
 * @param {object} props
 * @param {object} props.data
 * @param {(field:string,value:any)=>void} props.set
 * @param {Record<string,string>} props.errors
 * @param {Array<{slug:string,name:string,state:string}>} [props.cities]
 * @param {(blockers:Record<string,string>)=>void} [props.onBlockersChange]
 */
export default function StepPersonal({ data, set, errors, cities = CITIES, onBlockersChange }) {
  const [photoError, setPhotoError] = useState('');

  // ── Live problems, reported as they happen rather than on Continue ──────
  const emailTaken = useAvailability('email', data.email, isEmail);
  const phoneTaken = useAvailability('phone', data.phone, isPhone);
  // Only once there is something to compare — complaining that the field is
  // empty while it is still being typed into is noise, not help.
  const confirmMismatch =
    data.confirm && data.confirm !== data.password ? 'Passwords do not match.' : '';

  // Handed up so Continue can't step over a problem the visitor can see.
  useEffect(() => {
    onBlockersChange?.({
      email: emailTaken,
      phone: phoneTaken,
      confirm: confirmMismatch,
    });
  }, [emailTaken, phoneTaken, confirmMismatch, onBlockersChange]);

  // Downscaled in the browser before it ever reaches the server — a 4MB phone
  // photograph would otherwise be stored whole and shipped to every visitor.
  const handlePhoto = async (file) => {
    if (!file) return;
    try {
      setPhotoError('');
      set('photo', await fileToResizedDataURL(file, { maxDim: 512 }));
    } catch (err) {
      setPhotoError(err.message);
    }
  };

  // State first, city narrowed to it — asked the other way round the two could
  // disagree, and a profile would claim a city in a state it is not in.
  //
  // Every city in the state, not just the handful with landing pages: an
  // advocate in Latur should not have to call themselves a Mumbai lawyer for
  // want of their own city in the list.
  const citiesInState = allCitiesForState(data.state, cities);

  const onStateChange = (nextState) => {
    set('state', nextState);
    const inNextState = new Set(allCitiesForState(nextState, cities));
    if (data.city && !inNextState.has(data.city)) set('city', '');
    const kept = (data.practiceCities || []).filter((n) => inNextState.has(n));
    if (kept.length !== (data.practiceCities || []).length) set('practiceCities', kept);
  };

  return (
    <div className="space-y-6">
      {/* ── Photograph ─────────────────────────────────────────────────── */}
      <FormSection
        title="Profile photograph"
        description="Optional, but profiles with one get far more enquiries."
      >
        <div className="flex flex-wrap items-center gap-4">
          <Avatar
            src={data.photo}
            name={data.fullName || 'A'}
            size="lg"
            className="!h-16 !w-16 !rounded-2xl ring-1 ring-ink/10"
          />

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-primary/25 bg-primary/[0.06] px-3.5 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/10">
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink/12 px-3 py-2 text-[13px] font-semibold text-ink/60 transition-colors hover:border-rose-300 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            )}
          </div>
        </div>
        {photoError && <p className="mt-2 text-xs font-medium text-rose-600">{photoError}</p>}
      </FormSection>

      {/* ── Identity ───────────────────────────────────────────────────── */}
      <FormSection title="Personal details">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full Name" htmlFor="fullName" required error={errors.fullName} className="sm:col-span-2">
            <Input
              id="fullName"
              value={data.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              placeholder="Adv. Your Name"
              leftIcon={<User className="h-4 w-4" />}
              invalid={Boolean(errors.fullName)}
            />
          </FormField>

          <FormField
            label="Email Address"
            htmlFor="email"
            required
            error={errors.email || emailTaken}
          >
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              invalid={Boolean(errors.email || emailTaken)}
            />
          </FormField>

          <FormField
            label="Mobile Number"
            htmlFor="phone"
            required
            error={errors.phone || phoneTaken}
          >
            <Input
              id="phone"
              type="tel"
              value={data.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+91 98765 43210"
              leftIcon={<Phone className="h-4 w-4" />}
              invalid={Boolean(errors.phone || phoneTaken)}
            />
          </FormField>

          <FormField label="Gender" htmlFor="gender">
            <Select
              id="gender"
              value={data.gender}
              onChange={(e) => set('gender', e.target.value)}
              options={GENDERS}
              placeholder="Select gender"
            />
          </FormField>

          <FormField label="Date of Birth" htmlFor="dob">
            <Input
              id="dob"
              type="date"
              value={data.dob}
              onChange={(e) => set('dob', e.target.value)}
            />
          </FormField>
        </div>
      </FormSection>

      {/* ── Credentials ────────────────────────────────────────────────── */}
      <FormSection
        title="Account password"
        description="You will use your email and this password to sign in."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Password" htmlFor="password" required error={errors.password} hint="Minimum 8 characters.">
            <Input
              id="password"
              type="password"
              value={data.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Create a password"
              leftIcon={<Lock className="h-4 w-4" />}
              invalid={Boolean(errors.password)}
            />
          </FormField>

          <FormField
            label="Confirm Password"
            htmlFor="confirm"
            required
            error={errors.confirm || confirmMismatch}
          >
            <Input
              id="confirm"
              type="password"
              value={data.confirm}
              onChange={(e) => set('confirm', e.target.value)}
              placeholder="Re-enter password"
              leftIcon={<Lock className="h-4 w-4" />}
              invalid={Boolean(errors.confirm || confirmMismatch)}
            />
          </FormField>
        </div>
      </FormSection>

      {/* ── Location + languages ───────────────────────────────────────── */}
      <FormSection title="Location & languages">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="State" htmlFor="state" required error={errors.state}>
            <Select
              id="state"
              value={data.state}
              onChange={(e) => onStateChange(e.target.value)}
              options={STATES}
              placeholder="Select state"
              invalid={Boolean(errors.state)}
            />
          </FormField>

          <FormField
            label="City"
            htmlFor="city"
            required
            error={errors.city}
            hint={data.state ? undefined : 'Choose your state first.'}
          >
            <Select
              id="city"
              value={data.city}
              onChange={(e) => set('city', e.target.value)}
              disabled={!data.state}
              invalid={Boolean(errors.city)}
            >
              <option value="">{data.state ? 'Select city' : 'Select state first'}</option>
              {citiesInState.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
          </FormField>

          {/* No street address here. Where the advocate lives is not something
              clients need, and the address that matters — the office they are
              seen at — is asked for on the next step. */}

          <FormField
            label="Languages"
            required
            error={errors.languages}
            className="sm:col-span-2"
          >
            <ChipMultiSelect
              options={LANGUAGES}
              value={data.languages || []}
              onChange={(next) => set('languages', next)}
            />
          </FormField>
        </div>
      </FormSection>
    </div>
  );
}
