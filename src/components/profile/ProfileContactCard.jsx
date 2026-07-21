import { Clock, MessagesSquare } from 'lucide-react';
import { cn } from '@/utils/cn';
import { advocatePlans } from '@/constants/consultationPlans';
import ProfileContactActions from './ProfileContactActions';

/**
 * ProfileContactCard — sticky sidebar with the direct contact actions
 * (call / WhatsApp / email), the live-chat Book Consultation action, and
 * office timing.
 *
 * @param {object} props
 * @param {object} props.advocate  full profile
 */
export default function ProfileContactCard({ advocate }) {
  const { contact = {}, name } = advocate;
  const advocateId = advocate._id || advocate.id || '';
  // The lawyer's own live-chat rates (only the durations they priced).
  const plans = advocatePlans(advocate.consultationPlans);
  // Only keep timing rows that actually have a day + hours filled in.
  const timing = (advocate.timing || []).filter((t) => t && t.day && t.hours);
  const waText = encodeURIComponent(`Hi ${name}, I found your profile on Legal Care India and would like a consultation.`);

  return (
    <aside id="contact" className="scroll-mt-24 space-y-4 lg:sticky lg:top-24">
      <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
        {/* Live-chat plans the lawyer set — everyone sees the rates; the
            lawyer can confirm what they added, users see the options. */}
        {plans.length > 0 && (
          <div className="mb-4 rounded-xl border border-ink/8 bg-muted/40 p-3.5">
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/45">
              <MessagesSquare className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Live Chat Consultation
            </p>
            <ul className="space-y-2">
              {plans.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-ink/70">
                    <Clock className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
                    {p.label}
                  </span>
                  <span className="font-display font-bold text-primary">₹{p.price}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ProfileContactActions
          contact={contact}
          name={name}
          waText={waText}
          advocateId={advocateId}
          plans={plans}
        />
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
