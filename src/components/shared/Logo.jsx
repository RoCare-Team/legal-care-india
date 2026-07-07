import Link from 'next/link';
import { Scale } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SITE } from '@/constants/site';

/**
 * Logo — brand mark + wordmark, links home.
 *
 * @param {object} props
 * @param {boolean} [props.compact=false]  hide the wordmark (icon only)
 * @param {string} [props.className]
 */
export default function Logo({ compact = false, className }) {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} — home`}
      className={cn('inline-flex items-center gap-2.5', className)}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shadow-sm">
        <Scale className="h-5 w-5" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-semibold text-ink">
            Legal Care
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
            India
          </span>
        </span>
      )}
    </Link>
  );
}
