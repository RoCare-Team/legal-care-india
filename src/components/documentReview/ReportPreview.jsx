import Link from 'next/link';
import { ShieldAlert, FilePlus2, Sparkles, ArrowRight } from 'lucide-react';
import { RISK_META } from '@/constants/documentReview';

/**
 * What an AI review comes back as, shown beside the upload card.
 *
 * A signed-in client who has run one sees their own latest report (and can
 * open it); everyone else sees a sample, labelled as one, built from a real
 * run on a made-up rent agreement — so the promise on the left is backed by
 * the actual shape of the result rather than a description of it.
 */
const SAMPLE = {
  documentType: 'Residential rent agreement',
  summary:
    'Rent of ₹25,000 a month for 11 months, with a ₹1,50,000 deposit and a 20% rent rise every 6 months.',
  riskLevel: 'high',
  redFlags: [
    { title: 'Deposit refundable "at the landlord’s discretion"', severity: 'high' },
    { title: 'Landlord may enter at any time without notice', severity: 'high' },
    { title: 'Tenant pays for structural repairs', severity: 'medium' },
  ],
  missingClauses: [{ title: 'Governing law and jurisdiction' }],
};

const DOT = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };

/**
 * @param {object} props
 * @param {object} [props.review]  the client's latest completed AI review, if any
 */
export default function ReportPreview({ review }) {
  const own = Boolean(review?.ai?.documentType);
  const ai = own ? review.ai : SAMPLE;
  const risk = RISK_META[ai.riskLevel];
  const flags = (ai.redFlags || []).slice(0, 3);
  const missing = (ai.missingClauses || []).slice(0, 1);

  return (
    <div className="mt-8 max-w-xl overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-[0_18px_40px_-26px_rgba(30,58,95,0.45)]">
      <div className="flex items-center justify-between gap-3 border-b border-ink/[0.06] bg-muted/40 px-5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5 text-[#9A7B1C]" aria-hidden="true" />
          {own ? 'Your latest AI report' : 'Sample AI report'}
        </span>
        {risk && <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ring-1 ${risk.tone}`}>{risk.label}</span>}
      </div>

      <div className="px-5 py-4">
        <p className="font-display text-[17px] font-bold leading-snug text-ink">{ai.documentType}</p>
        {ai.summary && <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink/60">{ai.summary}</p>}

        {flags.length > 0 && (
          <div className="mt-3.5">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-ink/45">
              <ShieldAlert className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
              Red flags
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {flags.map((f) => (
                <li key={f.title} className="flex items-start gap-2 text-[13px] text-ink/80">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[f.severity] || DOT.medium}`} />
                  {f.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        {missing.length > 0 && (
          <p className="mt-3 flex items-start gap-1.5 text-[13px] text-ink/70">
            <FilePlus2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9A7B1C]" aria-hidden="true" />
            <span><b className="font-semibold text-ink">Missing:</b> {missing[0].title}</span>
          </p>
        )}
      </div>

      {own && (
        <Link
          href={`/document-review/${review.id}`}
          className="flex items-center justify-between border-t border-ink/[0.06] px-5 py-2.5 text-[13px] font-semibold text-primary hover:bg-primary/[0.03]"
        >
          Open full report <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
