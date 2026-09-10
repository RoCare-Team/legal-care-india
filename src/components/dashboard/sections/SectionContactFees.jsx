import { Phone, MessageCircle, Mail, IndianRupee, Clock } from 'lucide-react';
import { FormField, Input } from '@/components/ui';
import DashboardSection from '../DashboardSection';
import { RATE_FIELDS, MIN_RATE, MAX_RATE } from '@/constants/callRates';


/**
 * SectionContactFees — direct contact channels, the headline consultation fee,
 * and the lawyer's per-minute rate for each live channel.
 *
 * One number per channel rather than a list of duration packages: clients are
 * billed for the minutes a session actually runs, so there is no block of time
 * to price up front.
 */
/**
 * `contact` is why this takes a flag. The guided setup's Consultations step is
 * about what a slot costs; a lawyer's phone was verified by the code that let
 * them in and their email was taken on the step that made the account, so
 * asking for both again under a heading about consultations is two questions
 * that do not belong to the step they are asked on. The full editor keeps
 * them, because a contact number does change.
 */
export default function SectionContactFees({ data, set, contact = true }) {
  return (
    <>
      {contact && (
      <DashboardSection id="contact" title="Contact Details" description="How clients reach you directly." icon={Phone}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Phone Number" htmlFor="d-phone">
            <Input id="d-phone" value={data.phone} onChange={(e) => set('phone', e.target.value)} leftIcon={<Phone className="h-4 w-4" />} />
          </FormField>
          <FormField label="WhatsApp Number" htmlFor="d-wa">
            <Input id="d-wa" value={data.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} leftIcon={<MessageCircle className="h-4 w-4" />} />
          </FormField>
          <FormField label="Email Address" htmlFor="d-email" className="sm:col-span-2">
            <Input id="d-email" type="email" value={data.email} onChange={(e) => set('email', e.target.value)} leftIcon={<Mail className="h-4 w-4" />} />
          </FormField>
        </div>
      </DashboardSection>
      )}

      <DashboardSection
        id="slots"
        title="Consultation Rates"
        description="What you charge per minute, per channel — because ten minutes of typing is not ten minutes on camera."
        icon={Clock}
      >
        {/* Three numbers, not nine.

            This used to be a grid of block prices — 10 min, 30 min, 1 hour,
            for each of three channels — but a session is billed by the minute
            it actually runs, so the block was only ever a ceiling that had to
            be divided back down. The rate is the thing being decided; asking
            for it directly is one box instead of three, and no arithmetic.

            Blank means the channel is not offered. That is a real choice — a
            lawyer who will type but not appear on camera should be able to say
            so — so it is left empty rather than defaulted. */}
        <div className="grid gap-4 sm:grid-cols-3">
          {RATE_FIELDS.map(({ key, label }) => {
            const value = data[key] ?? '';
            const rate = Number(value);
            const offered = Number.isFinite(rate) && rate > 0;

            return (
              <FormField
                key={key}
                label={`${label} (₹/min)`}
                htmlFor={`d-rate-${key}`}
                hint={
                  offered
                    ? `A 10-minute session costs ₹${(rate * 10).toLocaleString('en-IN')}.`
                    : 'Blank — you do not offer this channel.'
                }
              >
                <Input
                  id={`d-rate-${key}`}
                  type="number"
                  min={MIN_RATE}
                  max={MAX_RATE}
                  value={value}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder="e.g. 50"
                  leftIcon={<IndianRupee className="h-4 w-4" />}
                />
              </FormField>
            );
          })}
        </div>

        <p className="mt-3 text-[12.5px] leading-relaxed text-ink/50">
          Clients are billed for the minutes a session actually runs — one that
          finishes early is never charged for time it did not use. Rates run from
          ₹{MIN_RATE} to ₹{MAX_RATE.toLocaleString('en-IN')} a minute.
        </p>
      </DashboardSection>




    </>
  );
}
