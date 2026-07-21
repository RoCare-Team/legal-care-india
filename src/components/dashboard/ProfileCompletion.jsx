import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

/**
 * ProfileCompletion — progress ring/bar + checklist driving lawyers to
 * finish their profile so it goes live.
 *
 * @param {object} props
 * @param {Array<{label:string,done:boolean,href:string}>} props.checklist
 */
export default function ProfileCompletion({ checklist }) {
  const done = checklist.filter((c) => c.done).length;
  const percent = Math.round((done / checklist.length) * 100);

  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Profile Completion</h2>
        <span className="font-display text-2xl font-semibold text-primary">{percent}%</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/8">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-ink/55">
        {percent === 100
          ? 'Your profile is complete and visible to clients.'
          : `Complete the remaining ${checklist.length - done} steps to maximise visibility.`}
      </p>

      <ul className="mt-5 space-y-1">
        {checklist.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-ink/5"
            >
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-ink/25" aria-hidden="true" />
              )}
              <span className={item.done ? 'text-ink/50 line-through' : 'text-ink/80'}>
                {item.label}
              </span>
              {!item.done && (
                <ArrowRight className="ml-auto h-4 w-4 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
