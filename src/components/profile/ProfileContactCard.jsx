import { Phone, MessageCircle, Mail, IndianRupee, Clock, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/utils/cn';

/**
 * ProfileContactCard — sticky sidebar with consultation fee, direct contact
 * actions (call / WhatsApp / email) and office timing.
 *
 * @param {object} props
 * @param {object} props.advocate  full profile
 */
export default function ProfileContactCard({ advocate }) {
  const { contact = {}, consultationFee, timing = [], name } = advocate;
  const waText = encodeURIComponent(`Hi ${name}, I found your profile on Legal Care India and would like a consultation.`);

  return (
    <aside id="contact" className="scroll-mt-24 space-y-4 lg:sticky lg:top-24">
      <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink/55">Consultation Fee</span>
          <span className="flex items-center font-display text-xl font-semibold text-ink">
            <IndianRupee className="h-4 w-4" aria-hidden="true" />
            {consultationFee}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {contact.phone && (
            <Button href={`tel:${contact.phone.replace(/\s/g, '')}`} fullWidth leftIcon={<Phone className="h-4 w-4" />}>
              Call Now
            </Button>
          )}
          {contact.whatsapp && (
            <Button
              href={`https://wa.me/${contact.whatsapp}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              className="bg-emerald-600 hover:bg-emerald-700"
              leftIcon={<MessageCircle className="h-4 w-4" />}
            >
              WhatsApp
            </Button>
          )}
          {contact.email && (
            <Button
              href={`mailto:${contact.email}`}
              variant="outline"
              fullWidth
              leftIcon={<Mail className="h-4 w-4" />}
            >
              Send Email
            </Button>
          )}
          <Button variant="ghost" fullWidth disabled leftIcon={<CalendarCheck className="h-4 w-4" />}>
            Book Consultation (Soon)
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
          Office Timing
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          {timing.map((t) => (
            <li key={t.day} className="flex items-center justify-between">
              <span className="text-ink/60">{t.day}</span>
              <span className={cn('font-medium', t.open ? 'text-ink/80' : 'text-ink/45')}>
                {t.hours}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
