import { Badge } from '@/components/ui';

/**
 * StepReview — read-only summary + terms acceptance (final step).
 *
 * @param {object} props
 * @param {object} props.data
 * @param {(field:string,value:any)=>void} props.set
 * @param {Record<string,string>} props.errors
 */
export default function StepReview({ data, set, errors }) {
  const rows = [
    ['Name', data.fullName],
    ['Email', data.email],
    ['Mobile', data.phone],
    ['Bar Council No.', data.barCouncil],
    ['Experience', data.experience ? `${data.experience} years` : ''],
    ['Location', [data.city, data.state].filter(Boolean).join(', ')],
    ['Office', data.officeName],
    ['Consultation Fee', data.fee ? `₹${data.fee}` : ''],
  ];

  return (
    <div className="space-y-6">
      <dl className="grid gap-x-6 gap-y-4 rounded-xl border border-ink/8 bg-muted/40 p-5 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-ink/45">{label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink/85">{value || '—'}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="mb-2 text-xs text-ink/45">Legal Services</p>
        <div className="flex flex-wrap gap-1.5">
          {(data.services || []).map((s) => (
            <Badge key={s} variant="primary" size="sm">{s}</Badge>
          ))}
          {(data.languages || []).map((l) => (
            <Badge key={l} variant="secondary" size="sm">{l}</Badge>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-ink/8 p-4">
        <input
          type="checkbox"
          checked={data.terms}
          onChange={(e) => set('terms', e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-ink/30 text-primary focus:ring-primary/40"
        />
        <span className="text-sm text-ink/70">
          I confirm the information provided is accurate and I agree to the{' '}
          <a href="/terms" className="font-medium text-primary hover:underline">Terms of Service</a>{' '}
          and{' '}
          <a href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</a>.
        </span>
      </label>
      {errors.terms && <p className="-mt-3 text-xs text-red-600">{errors.terms}</p>}
    </div>
  );
}
