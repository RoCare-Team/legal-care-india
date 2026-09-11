import Link from 'next/link';
import { Scale, ArrowUpRight, ChevronDown } from 'lucide-react';
import ProfileSection from './ProfileSection';

/** Specific areas shown before the rest fold behind "Show all". */
const AREA_PREVIEW = 14;

/**
 * ProfileLegalServices — the legal services this lawyer practises, each
 * linking to the corresponding directory listing, and the specific matters
 * under them.
 *
 * A lawyer can tick fifty-odd specific areas, which drew a wall of chips taller
 * than the rest of the profile. The first few are shown and the rest fold
 * behind a native <details>: no client JavaScript, and every area stays in the
 * page for search.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileLegalServices({ advocate }) {
  const services = advocate.legalServices || [];
  const subServices = advocate.subSpecializations || [];
  if (services.length === 0 && subServices.length === 0) return null;

  const shown = subServices.slice(0, AREA_PREVIEW);
  const folded = subServices.slice(AREA_PREVIEW);

  return (
    <ProfileSection id="legal-services" title="Legal Services" icon={Scale}>
      {services.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {services.map((s) => (
            <Link
              key={s.slug}
              href={`/lawyers?service=${s.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-ink/8 bg-[#F8FAFC] px-3.5 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-accent shadow-sm ring-1 ring-ink/[0.06]">
                <Scale className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex-1 text-[14px] font-semibold text-ink/85 group-hover:text-primary">
                {s.name}
              </span>
              <ArrowUpRight className="h-4 w-4 text-ink/30 transition-colors group-hover:text-primary" aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}

      {subServices.length > 0 && (
        <div className={services.length > 0 ? 'mt-6' : ''}>
          <p className="mb-2.5 text-[11.5px] font-bold uppercase tracking-wide text-ink/45">
            Specific areas <span className="text-ink/30">· {subServices.length}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {shown.map((s) => (
              <AreaChip key={s}>{s}</AreaChip>
            ))}
          </div>

          {folded.length > 0 && (
            <details className="group mt-2.5">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[13px] font-semibold text-primary hover:underline [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Show all {subServices.length} areas</span>
                <span className="hidden group-open:inline">Show fewer</span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {folded.map((s) => (
                  <AreaChip key={s}>{s}</AreaChip>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </ProfileSection>
  );
}

function AreaChip({ children }) {
  return (
    <span className="rounded-lg border border-ink/8 bg-white px-2.5 py-1 text-[12.5px] font-medium text-ink/70">
      {children}
    </span>
  );
}
