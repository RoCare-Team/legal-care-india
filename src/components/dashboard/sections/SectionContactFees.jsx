import { Phone, MessageCircle, Mail, IndianRupee, MessagesSquare, Clock, Video } from 'lucide-react';
import { FormField, Input } from '@/components/ui';
import DashboardSection from '../DashboardSection';
import RepeatableList from '../RepeatableList';
import { formatDuration } from '@/constants/consultationPlans';

/**
 * SectionContactFees — direct contact channels, the headline consultation fee,
 * and the lawyer's own live-chat plans (they set both duration and price).
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

      <DashboardSection
        id="chat-rates"
        title="Live Chat Consultation Plans"
        description="Add your own plans — you choose the duration and the price. Clients see exactly these. Add none to not offer live chat."
        icon={MessagesSquare}
      >
        <RepeatableList
          items={data.consultationPlans || []}
          onChange={(v) => set('consultationPlans', v)}
          template={{ minutes: '', price: '' }}
          addLabel="Add plan"
          renderRow={(item, update) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Duration (minutes)"
                hint={item.minutes ? formatDuration(item.minutes) : 'e.g. 15, 30, 60'}
              >
                <Input
                  type="number"
                  min="5"
                  max="480"
                  placeholder="15"
                  value={item.minutes}
                  onChange={(e) => update({ minutes: e.target.value })}
                  leftIcon={<Clock className="h-4 w-4" />}
                />
              </FormField>
              <FormField label="Price (₹)" hint="What you charge for this plan.">
                <Input
                  type="number"
                  min="1"
                  placeholder="500"
                  value={item.price}
                  onChange={(e) => update({ price: e.target.value })}
                  leftIcon={<IndianRupee className="h-4 w-4" />}
                />
              </FormField>
            </div>
          )}
        />
      </DashboardSection>

      <DashboardSection
        id="video-rates"
        title="Video Call Plans"
        description="Priced separately from chat — set your own duration and price for a video consultation. Add none to not offer video calls."
        icon={Video}
      >
        <RepeatableList
          items={data.videoPlans || []}
          onChange={(v) => set('videoPlans', v)}
          template={{ minutes: '', price: '' }}
          addLabel="Add video plan"
          renderRow={(item, update) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Duration (minutes)"
                hint={item.minutes ? formatDuration(item.minutes) : 'e.g. 15, 30, 60'}
              >
                <Input
                  type="number"
                  min="5"
                  max="480"
                  placeholder="15"
                  value={item.minutes}
                  onChange={(e) => update({ minutes: e.target.value })}
                  leftIcon={<Clock className="h-4 w-4" />}
                />
              </FormField>
              <FormField label="Price (₹)" hint="What you charge for this video call.">
                <Input
                  type="number"
                  min="1"
                  placeholder="800"
                  value={item.price}
                  onChange={(e) => update({ price: e.target.value })}
                  leftIcon={<IndianRupee className="h-4 w-4" />}
                />
              </FormField>
            </div>
          )}
        />
      </DashboardSection>
    </>
  );
}
