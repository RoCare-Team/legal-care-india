import { Phone, MessageCircle, Mail, IndianRupee, MessagesSquare, Video, PhoneCall, Timer } from 'lucide-react';
import { FormField, Input } from '@/components/ui';
import DashboardSection from '../DashboardSection';
import { MAX_RATE, formatRate } from '@/constants/callRates';

/** The three live channels, each priced independently by the minute. */
const RATE_SECTIONS = [
  {
    id: 'chat-rates',
    field: 'chatRate',
    title: 'Live Chat Rate',
    icon: MessagesSquare,
    description:
      'What you charge per minute of live chat. Leave blank to not offer live chat at all.',
    placeholder: '10',
  },
  {
    id: 'audio-rates',
    field: 'audioRate',
    title: 'Audio Call Rate',
    icon: PhoneCall,
    description:
      'What you charge per minute of a voice call. Leave blank and your Call button tells clients you don’t take audio calls.',
    placeholder: '20',
  },
  {
    id: 'video-rates',
    field: 'videoRate',
    title: 'Video Call Rate',
    icon: Video,
    description:
      'Priced separately from chat — what a minute of video consultation costs. Leave blank to not offer video calls.',
    placeholder: '30',
  },
];

/**
 * SectionContactFees — direct contact channels, the headline consultation fee,
 * and the lawyer's per-minute rate for each live channel.
 *
 * One number per channel rather than a list of duration packages: clients are
 * billed for the minutes a session actually runs, so there is no block of time
 * to price up front.
 */
export default function SectionContactFees({ data, set }) {
  return (
    <>
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

      <DashboardSection id="fees" title="Consultation Fees" description="Shown prominently on your profile." icon={IndianRupee}>
        <FormField label="Consultation Fee (₹)" htmlFor="d-fee" hint="Enter 0 for a free first consultation.">
          <Input id="d-fee" type="number" min="0" value={data.fee} onChange={(e) => set('fee', e.target.value)} leftIcon={<IndianRupee className="h-4 w-4" />} className="max-w-xs" />
        </FormField>
      </DashboardSection>

      {RATE_SECTIONS.map(({ id, field, title, icon, description, placeholder }) => (
        <DashboardSection key={id} id={id} title={title} description={description} icon={icon}>
          <FormField
            label="Rate per minute (₹)"
            htmlFor={`d-${field}`}
            hint={
              Number(data[field]) > 0
                ? `Clients are billed ${formatRate(data[field])}, for the minutes the session actually runs.`
                : 'Billed by the minute, from the moment the session connects.'
            }
          >
            <Input
              id={`d-${field}`}
              type="number"
              min="1"
              max={MAX_RATE}
              value={data[field] ?? ''}
              onChange={(e) => set(field, e.target.value)}
              placeholder={placeholder}
              leftIcon={<Timer className="h-4 w-4" />}
              className="max-w-xs"
            />
          </FormField>
        </DashboardSection>
      ))}

    </>
  );
}
