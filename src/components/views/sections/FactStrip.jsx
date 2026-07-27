import Link from 'next/link';

/**
 * A horizontal row of key facts, sitting under a page's intro.
 *
 * Replaces the tall "At a glance" card that used to occupy the right column —
 * that column now belongs to the lawyer rail, and three facts read perfectly
 * well laid out across instead of stacked down.
 *
 * @param {object} props
 * @param {Array<{icon:Function, label:string, value:any, href?:string,
 *                tone?:'default'|'positive'}>} props.facts
 */
export default function FactStrip({ facts = [] }) {
  if (!facts.length) return null;

  return (
    <dl className="mt-8 grid gap-3 rounded-2xl border border-ink/8 bg-muted/40 p-4 sm:grid-cols-3">
      {facts.map(({ icon: Icon, label, value, href, tone }) => (
        <div key={label} className="flex items-center gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
              tone === 'positive'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-xs text-ink/50">{label}</dt>
            <dd className="truncate font-semibold text-ink">
              {href ? (
                <Link href={href} className="hover:text-primary">
                  {value}
                </Link>
              ) : (
                value
              )}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
