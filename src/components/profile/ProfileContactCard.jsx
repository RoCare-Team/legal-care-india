import { IndianRupee, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import ProfileContactActions from './ProfileContactActions';

/**
 * ProfileContactCard — sticky sidebar with consultation fee, direct contact
 * actions (call / WhatsApp / email) and office timing.
 *
 * @param {object} props
 * @param {object} props.advocate  full profile
 */
export default function ProfileContactCard({ advocate }) {
  const { contact = {}, consultationFee, name } = advocate;
  // Only keep timing rows that actually have a day + hours filled in.
  const timing = (advocate.timing || []).filter((t) => t && t.day && t.hours);
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

        <ProfileContactActions contact={contact} name={name} waText={waText} />
      </div>

      {timing.length > 0 && (
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
      )}
    </aside>
  );
}
