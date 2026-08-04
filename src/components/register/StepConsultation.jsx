'use client';

import { IndianRupee, Clock, MessagesSquare, Phone, Video } from 'lucide-react';
import { FormField, Input, Textarea } from '@/components/ui';
import { MAX_RATE } from '@/constants/callRates';
import FormSection from './FormSection';

/**
 * The three live channels, each with its own per-minute rate. Video usually
 * costs more than chat, so they are asked for separately rather than derived
 * from one another.
 */
const CHANNELS = [
  {
    field: 'chatRate',
    label: 'Live Chat',
    icon: MessagesSquare,
    placeholder: '10',
  },
  {
    field: 'audioRate',
    label: 'Audio Call',
    icon: Phone,
    placeholder: '20',
  },
  {
    field: 'videoRate',
    label: 'Video Call',
    icon: Video,
    placeholder: '30',
  },
];

/**
 * StepConsultation — what the advocate charges per minute, when they sit, and
 * their write-up (step 4 of 5).
 *
 * Rates, not packages. The advocate names a price per minute for each channel
 * and a session bills the minutes it actually ran — so a call answered and
 * finished in three minutes costs three minutes, and neither side has to
 * guess a duration up front.
 *
 * Leaving a rate blank simply means that channel is not offered; an advocate
 * who only wants to take chat can say so by filling in one box.
 *
 * @param {object} props
 * @param {object} props.data
 * @param {(field:string,value:any)=>void} props.set
 * @param {Record<string,string>} props.errors
 */
export default function StepConsultation({ data, set, errors }) {
  return (
    <div className="space-y-6">
      <FormSection
        title="Your per-minute rates"
        description="Clients pay only for the minutes a session runs. Blank ⇒ you don’t offer that channel. Changeable any time."
      >
        {errors.rates && <p className="mb-3 text-xs font-medium text-rose-600">{errors.rates}</p>}

        <div className="grid gap-4 sm:grid-cols-3">
          {CHANNELS.map(({ field, label, icon: Icon, placeholder }) => (
            <FormField
              key={field}
              label={`${label} (₹/min)`}
              htmlFor={field}
              error={errors[field]}
            >
              <Input
                id={field}
                type="number"
                min="1"
                max={MAX_RATE}
                value={data[field] ?? ''}
                onChange={(e) => set(field, e.target.value)}
                placeholder={placeholder}
                leftIcon={<Icon className="h-4 w-4" />}
                invalid={Boolean(errors[field])}
              />
            </FormField>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField
            label="Standard Consultation Fee (₹)"
            htmlFor="fee"
            hint="Your in-person fee — not used for live sessions."
          >
            <Input
              id="fee"
              type="number"
              min="0"
              value={data.fee}
              onChange={(e) => set('fee', e.target.value)}
              placeholder="e.g. 1000"
              leftIcon={<IndianRupee className="h-4 w-4" />}
            />
          </FormField>

          <FormField
            label="Office Timing"
            htmlFor="officeTiming"
          >
            <Input
              id="officeTiming"
              value={data.officeTiming}
              onChange={(e) => set('officeTiming', e.target.value)}
              placeholder="e.g. Mon – Sat, 10 AM – 7 PM"
              leftIcon={<Clock className="h-4 w-4" />}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="About you"
        description="The first thing a client reads on your profile."
      >
        <div className="grid gap-4">
          <FormField
            label="Headline / Tagline"
            htmlFor="tagline"
          >
            <Input
              id="tagline"
              value={data.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder="e.g. Trusted family & civil dispute expert"
            />
          </FormField>

          <FormField
            label="About You"
            htmlFor="about"
            required
            error={errors.about}
            hint="At least 40 characters."
          >
            <Textarea
              id="about"
              rows={4}
              value={data.about}
              onChange={(e) => set('about', e.target.value)}
              placeholder="Tell clients about your practice, notable areas of expertise and how you help..."
              invalid={Boolean(errors.about)}
            />
          </FormField>
        </div>
      </FormSection>
    </div>
  );
}
