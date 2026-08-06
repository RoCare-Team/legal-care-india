'use client';

import { Award, Building2, CalendarDays, Briefcase, MapPin } from 'lucide-react';
import { FormField, Input, Select, Textarea } from '@/components/ui';
import { cn } from '@/utils/cn';
import FormSection from './FormSection';

/** How the advocate practises — kept broad enough to cover most arrangements. */
const PRACTICE_MODES = [
  'Independent practice',
  'Law firm',
  'Chamber / senior counsel',
  'Corporate / in-house',
  'Government / public prosecutor',
];

/** Common designations, offered as suggestions rather than a closed list. */
const DESIGNATIONS = [
  'Advocate',
  'Senior Advocate',
  'Advocate-on-Record',
  'Partner',
  'Managing Partner',
  'Associate',
  'Legal Consultant',
  'Notary',
];

/**
 * StepProfessional — enrolment, standing and the office clients come to
 * (step 2 of 5).
 *
 * Bar Council number, experience and the office are required, as they always
 * were. The rest — which Bar Council, when they enrolled, their designation,
 * chamber and mode of practice — is optional detail that fills out a profile
 * without standing between an advocate and an account.
 *
 * @param {object} props
 * @param {object} props.data
 * @param {(field:string,value:any)=>void} props.set
 * @param {Record<string,string>} props.errors
 */
export default function StepProfessional({ data, set, errors }) {
  return (
    <div className="space-y-6">
      {/* ── Enrolment ──────────────────────────────────────────────────── */}
      <FormSection
        title="Bar Council enrolment"
        description="Verified before your profile is published."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {/* One Bar Council question, not two. The enrolment number already
              carries the State Bar Council that issued it, so asking for the
              state again was a second field that could only ever disagree
              with the first. */}
          <FormField
            label="Bar Council Number"
            htmlFor="barCouncil"
            required
            error={errors.barCouncil}
            className="sm:col-span-2"
          >
            <Input
              id="barCouncil"
              value={data.barCouncil}
              onChange={(e) => set('barCouncil', e.target.value)}
              placeholder="e.g. D/1234/2015"
              leftIcon={<Award className="h-4 w-4" />}
              invalid={Boolean(errors.barCouncil)}
            />
          </FormField>

          <FormField label="Enrollment Date" htmlFor="enrollmentDate">
            <Input
              id="enrollmentDate"
              type="date"
              value={data.enrollmentDate}
              onChange={(e) => set('enrollmentDate', e.target.value)}
            />
          </FormField>

          <FormField label="Years of Experience" htmlFor="experience" required error={errors.experience}>
            <Input
              id="experience"
              type="number"
              min="0"
              value={data.experience}
              onChange={(e) => set('experience', e.target.value)}
              placeholder="e.g. 8"
              leftIcon={<CalendarDays className="h-4 w-4" />}
              invalid={Boolean(errors.experience)}
            />
          </FormField>
        </div>
      </FormSection>

      {/* ── Standing ───────────────────────────────────────────────────── */}
      <FormSection
        title="How you practise"
        description="Shown on your profile beneath your name. All optional."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Current Designation" htmlFor="designation">
            <Input
              id="designation"
              list="designation-options"
              value={data.designation}
              onChange={(e) => set('designation', e.target.value)}
              placeholder="e.g. Senior Advocate"
              leftIcon={<Briefcase className="h-4 w-4" />}
            />
            {/* A datalist, not a select: these cover most advocates, but the
                list is nowhere near exhaustive and a fixed one would force the
                rest into the wrong box. */}
            <datalist id="designation-options">
              {DESIGNATIONS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </FormField>

          <FormField label="Practice Mode" htmlFor="practiceMode">
            <Select
              id="practiceMode"
              value={data.practiceMode}
              onChange={(e) => set('practiceMode', e.target.value)}
              options={PRACTICE_MODES}
              placeholder="Select practice mode"
            />
          </FormField>

          <FormField label="Chamber / Firm Name" htmlFor="chamberName" className="sm:col-span-2">
            <Input
              id="chamberName"
              value={data.chamberName}
              onChange={(e) => set('chamberName', e.target.value)}
              placeholder="e.g. Sharma & Associates"
              leftIcon={<Building2 className="h-4 w-4" />}
            />
          </FormField>
        </div>
      </FormSection>

      {/* ── Office ─────────────────────────────────────────────────────── */}
      <FormSection
        title="Office"
        description="Where clients meet you — this is what “lawyers near me” searches rank on."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Office Name" htmlFor="officeName" required error={errors.officeName}>
            <Input
              id="officeName"
              value={data.officeName}
              onChange={(e) => set('officeName', e.target.value)}
              placeholder="e.g. Chamber No. 214, Tis Hazari Courts"
              invalid={Boolean(errors.officeName)}
            />
          </FormField>

          {/* No PIN here. It is asked once, on step 1, where it fills in the
              state and city — a second input bound to the same value would let
              the two disagree on screen and quietly overwrite each other. */}

          <FormField label="Office Address" htmlFor="officeAddress" required error={errors.officeAddress} className="sm:col-span-2">
            <Textarea
              id="officeAddress"
              rows={2}
              value={data.officeAddress}
              onChange={(e) => set('officeAddress', e.target.value)}
              placeholder="Building, street, area and landmark"
              invalid={Boolean(errors.officeAddress)}
            />
          </FormField>

          {/* Plenty of advocates also see clients at home. Asked as a toggle
              rather than two more always-visible fields, since most don't —
              and an empty pair of address boxes reads as work left undone. */}
          <div className="sm:col-span-2">
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(data.practiceFromResidence)}
              onClick={() => set('practiceFromResidence', !data.practiceFromResidence)}
              className="inline-flex items-center gap-2.5 text-sm font-medium text-ink/80"
            >
              <span
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                  data.practiceFromResidence ? 'bg-primary' : 'bg-ink/20'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                    data.practiceFromResidence ? 'translate-x-[1.125rem]' : 'translate-x-[0.1875rem]'
                  )}
                />
              </span>
              Also practice from residence?
            </button>
          </div>

          {data.practiceFromResidence && (
            <>
              <FormField
                label="Residence Address"
                htmlFor="residenceAddress"
                className="sm:col-span-2"
              >
                <Textarea
                  id="residenceAddress"
                  rows={2}
                  value={data.residenceAddress}
                  onChange={(e) => set('residenceAddress', e.target.value)}
                  placeholder="Building, street, area and landmark"
                />
              </FormField>

              <FormField
                label="Residence PIN Code"
                htmlFor="residencePincode"
                error={errors.residencePincode}
              >
                <Input
                  id="residencePincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={data.residencePincode}
                  onChange={(e) => set('residencePincode', e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 122001"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  invalid={Boolean(errors.residencePincode)}
                />
              </FormField>
            </>
          )}
        </div>
      </FormSection>
    </div>
  );
}
