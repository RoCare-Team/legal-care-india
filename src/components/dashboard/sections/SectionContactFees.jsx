import { Phone, MessageCircle, Mail, IndianRupee } from 'lucide-react';
import { FormField, Input } from '@/components/ui';
import DashboardSection from '../DashboardSection';

/**
 * SectionContactFees — direct contact channels and consultation fee.
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
    </>
  );
}
