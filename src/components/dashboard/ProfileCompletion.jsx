import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, ShieldCheck } from 'lucide-react';

/**
 * How complete this profile is, and the way to finish it.
 *
 * Grouped by the same steps the guided setup walks through, so a lawyer who
 * sees "Your credentials — 1/3" here and clicks it lands on the step that says
 * the same thing. A flat list of twelve ticks told them what was missing; it
 * did not tell them where to go, and most did not go.
 *
 * @param {object} props
 * @param {object} props.progress  from `completionOf` in lib/profileCompletion
 */
export default function ProfileCompletion({ progress }) {
  const { percent, done, total, steps } = progress;
  const complete = percent === 100;

  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Profile Completion</h2>
        <span
          className={`font-display text-2xl font-semibold ${
            complete ? 'text-emerald-600' : 'text-primary'
          }`}
        >
          {percent}%
        </span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/8">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            complete ? 'bg-emerald-500' : 'bg-primary'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 text-sm leading-relaxed text-ink/55">
        {complete ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Complete — ready for our team to review.
          </span>
        ) : (
          <>
            {done} of {total} details done. A fuller profile ranks better in
            search and gets opened more often.
          </>
        )}
      </p>

      <ul className="mt-5 space-y-1">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              href="/setup"
              className="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-ink/5"
            >
              {step.complete ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-ink/25" aria-hidden="true" />
              )}
              <span className={step.complete ? 'text-ink/50 line-through' : 'text-ink/80'}>
                {step.title}
              </span>
              <span className="ml-auto flex items-center gap-2">
                <span
                  className={`text-xs tabular-nums ${
                    step.complete ? 'text-ink/30' : 'text-ink/45'
                  }`}
                >
                  {step.done}/{step.total}
                </span>
                {!step.complete && (
                  <ArrowRight className="h-4 w-4 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {!complete && (
        <Link
          href="/setup"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Continue setting up
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
