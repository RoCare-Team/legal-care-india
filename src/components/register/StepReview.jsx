'use client';

import Link from 'next/link';
import { User, Award, Scale, MessagesSquare } from 'lucide-react';
import { Badge, Avatar } from '@/components/ui';
import { formatRate } from '@/constants/callRates';

/**
 * StepReview — everything entered, read back before submitting (step 5 of 5).
 *
 * Grouped into the same four subjects the wizard asked them in, so an advocate
 * checking their entry looks in the place they filled it. A flat list of twenty
 * rows makes them read all twenty to find the one they want to correct.
 *
 * @param {object} props
 * @param {object} props.data
 * @param {(field:string,value:any)=>void} props.set
 * @param {Record<string,string>} props.errors
 */

/** One titled card of label/value rows. Rows with no value are dropped. */
function SummaryCard({ icon: Icon, title, rows = [], children }) {
  const filled = rows.filter(([, value]) => value);

  return (
    <section className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2.5 border-b border-ink/8 pb-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h3 className="font-display text-[15px] font-bold text-ink">{title}</h3>
      </div>

      {filled.length > 0 && (
        <dl className="grid gap-x-6 gap-y-4 pt-4 sm:grid-cols-2">
          {filled.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-ink/45">{label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-ink/85">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {children}
    </section>
  );
}

/** A labelled row of chips, hidden entirely when there is nothing to show. */
function ChipRow({ label, items = [], variant = 'primary' }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs text-ink/45">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge key={item} variant={variant} size="sm">{item}</Badge>
        ))}
      </div>
    </div>
  );
}

/** '2015-03-19' → '19 March 2015'; blank stays blank. */
function readableDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function StepReview({ data, set, errors }) {
  // Only the channels the advocate actually priced.
  const rates = [
    ['Live chat', data.chatRate],
    ['Audio call', data.audioRate],
    ['Video call', data.videoRate],
  ].filter(([, rate]) => Number(rate) > 0);

  return (
    <div className="space-y-6">
      {/* Identity, shown as it will appear */}
      <div className="flex items-center gap-4 rounded-2xl border border-ink/8 bg-muted/40 p-5">
        <Avatar
          src={data.photo}
          name={data.fullName || 'A'}
          size="lg"
          className="!h-16 !w-16 !rounded-2xl ring-1 ring-ink/10"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-ink">
            {data.fullName || 'Your name'}
          </p>
          <p className="mt-0.5 truncate text-sm text-ink/55">
            {[data.designation, data.city && `${data.city}, ${data.state}`]
              .filter(Boolean)
              .join(' · ') || 'Your profile summary'}
          </p>
        </div>
      </div>

      <SummaryCard
        icon={User}
        title="Personal details"
        rows={[
          ['Full name', data.fullName],
          ['Email', data.email],
          ['Mobile', data.phone],
          ['Gender', data.gender],
          ['Date of birth', readableDate(data.dob)],
          ['Location', [data.city, data.state].filter(Boolean).join(', ')],
          ['PIN code', data.pincode],
        ]}
      >
        <ChipRow label="Languages" items={data.languages} variant="secondary" />
      </SummaryCard>

      <SummaryCard
        icon={Award}
        title="Professional details"
        rows={[
          ['Bar Council number', data.barCouncil],
          ['Enrollment date', readableDate(data.enrollmentDate)],
          ['Experience', data.experience ? `${data.experience} years` : ''],
          ['Designation', data.designation],
          ['Practice mode', data.practiceMode],
          ['Chamber / firm', data.chamberName],
          ['Office', data.officeName],
          ['Office address', data.officeAddress],
          ['Residence address', data.practiceFromResidence ? data.residenceAddress : ''],
          ['Residence PIN code', data.practiceFromResidence ? data.residencePincode : ''],
        ]}
      />

      <SummaryCard icon={Scale} title="Practice details">
        <ChipRow label="Courts" items={data.courts} />
        <ChipRow label="Practice areas" items={data.services} />
        <ChipRow label="Special expertise" items={data.subServices} variant="neutral" />
        <ChipRow label="Cities you work in" items={data.practiceCities} variant="secondary" />
      </SummaryCard>

      <SummaryCard
        icon={MessagesSquare}
        title="Consultation details"
        rows={[
          ['Standard fee', data.fee ? `₹${Number(data.fee).toLocaleString('en-IN')}` : ''],
          ['Office timing', data.officeTiming],
          ['Headline', data.tagline],
        ]}
      >
        {rates.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-ink/45">Live session rates</p>
            <div className="flex flex-wrap gap-1.5">
              {rates.map(([label, rate]) => (
                <Badge key={label} variant="neutral" size="sm">
                  {label} · {formatRate(rate)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.about && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs text-ink/45">About you</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink/70">{data.about}</p>
          </div>
        )}
      </SummaryCard>

      <label className="flex items-start gap-3 rounded-2xl border border-ink/8 bg-surface p-4">
        <input
          type="checkbox"
          checked={data.terms}
          onChange={(e) => set('terms', e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-ink/30 text-primary focus:ring-primary/40"
        />
        <span className="text-sm text-ink/70">
          I confirm the information provided is accurate and I agree to the{' '}
          <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
        </span>
      </label>
      {errors.terms && <p className="-mt-3 text-xs font-medium text-rose-600">{errors.terms}</p>}
    </div>
  );
}
