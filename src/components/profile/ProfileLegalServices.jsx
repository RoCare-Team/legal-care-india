import Link from 'next/link';
import { Scale, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui';
import ProfileSection from './ProfileSection';

/**
 * ProfileLegalServices — the legal services this advocate practises,
 * each linking to the corresponding directory listing.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileLegalServices({ advocate }) {
  const services = advocate.legalServices || [];
  const subServices = advocate.subSpecializations || [];

  return (
    <ProfileSection id="legal-services" title="Legal Services" icon={Scale}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {services.map((s) => (
          <Link
            key={s.slug}
            href={`/advocates?service=${s.slug}`}
            className="group flex items-center justify-between gap-2 rounded-xl border border-ink/8 bg-muted/40 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <span className="text-sm font-medium text-ink/80 group-hover:text-primary">
              {s.name}
            </span>
            <ArrowUpRight className="h-4 w-4 text-ink/30 transition-colors group-hover:text-primary" />
          </Link>
        ))}
      </div>

      {subServices.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">
            Specific areas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {subServices.map((s) => (
              <Badge key={s} variant="neutral" size="sm">{s}</Badge>
            ))}
          </div>
        </div>
      )}
    </ProfileSection>
  );
}
