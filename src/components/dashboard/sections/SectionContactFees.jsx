import { Phone, MessageCircle, Mail, IndianRupee, Clock } from 'lucide-react';
import { FormField, Input } from '@/components/ui';
import DashboardSection from '../DashboardSection';
import {
  CONSULTATION_SLOTS, CONSULTATION_CHANNELS, slotKey,
} from '@/constants/consultationSlots';


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
        title="Bookable Slots"
        description="What a client pays to book a block of your time — priced per channel, because ten minutes of typing is not ten minutes on camera."
        icon={Clock}
      >
        {/* Three channels down, three lengths across. Nine boxes is a lot to
            put in front of someone, so every one of them is optional: a blank
            falls back to what the lawyer set before channels existed, and then
            to our standard price. Nobody has to fill all nine to be bookable. */}
        <div className="space-y-4">
          {CONSULTATION_CHANNELS.map((channel) => (
            <div
              key={channel.key}
              className="rounded-xl border border-ink/10 bg-muted/25 p-4"
            >
              <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="text-[13.5px] font-semibold text-ink">{channel.label}</p>
                <p className="text-[12px] text-ink/45">{channel.blurb}</p>
                {channel.card && (
                  <span className="ml-auto rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Shown on your directory card
                  </span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {CONSULTATION_SLOTS.map((slot) => {
                  const key = slotKey(channel.key, slot.minutes);
                  const own = Number(data.slotPrices?.[key]) > 0;
                  const shared = Number(data.slotPrices?.[slot.minutes]) > 0
                    ? Number(data.slotPrices[slot.minutes])
                    : slot.defaultPrice;

                  return (
                    <FormField
                      key={key}
                      label={`${slot.label} (₹)`}
                      htmlFor={`d-slot-${channel.key}-${slot.minutes}`}
                      hint={own ? 'Your price.' : `Blank — clients see ₹${shared}.`}
                    >
                      <Input
                        id={`d-slot-${channel.key}-${slot.minutes}`}
                        type="number"
                        min="1"
                        value={data.slotPrices?.[key] ?? ''}
                        onChange={(e) =>
                          set('slotPrices', {
                            ...(data.slotPrices || {}),
                            [key]: e.target.value,
                          })
                        }
                        placeholder={`${shared}`}
                        leftIcon={<IndianRupee className="h-4 w-4" />}
                      />
                    </FormField>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[12.5px] leading-relaxed text-ink/50">
          A slot is the most a consultation can cost — one that finishes early
          bills only the minutes it ran, so a client is never charged for time
          they did not use.
        </p>
      </DashboardSection>

      <DashboardSection id="fees" title="Consultation Fees" description="Your in-person fee, shown on your profile. Not used for online sessions." icon={IndianRupee}>
        <FormField label="Consultation Fee (₹)" htmlFor="d-fee" hint="Enter 0 for a free first consultation.">
          <Input id="d-fee" type="number" min="0" value={data.fee} onChange={(e) => set('fee', e.target.value)} leftIcon={<IndianRupee className="h-4 w-4" />} className="max-w-xs" />
        </FormField>
      </DashboardSection>


    </>
  );
}
