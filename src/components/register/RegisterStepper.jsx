import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * RegisterStepper — horizontal progress indicator for the registration wizard.
 *
 * @param {object} props
 * @param {string[]} props.steps       step labels
 * @param {number} props.current       zero-based active step index
 */
export default function RegisterStepper({ steps, current }) {
  return (
    <ol className="flex items-center">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors',
                  done && 'bg-primary text-white',
                  active && 'bg-primary/15 text-primary ring-2 ring-primary',
                  !done && !active && 'bg-ink/8 text-ink/50'
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {/* Only the step being filled is named. The other four labels
                  were the widest thing in the rail and said nothing the
                  numbers and the heading below don't already. */}
              <span
                className={cn(
                  'text-[13px] font-medium',
                  active ? 'text-ink' : 'hidden text-ink/50 lg:block'
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn('mx-2 h-px flex-1 sm:mx-3', done ? 'bg-primary' : 'bg-ink/12')}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
