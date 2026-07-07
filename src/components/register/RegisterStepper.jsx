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
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors',
                  done && 'bg-primary text-white',
                  active && 'bg-primary/15 text-primary ring-2 ring-primary',
                  !done && !active && 'bg-ink/8 text-ink/50'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-medium sm:block',
                  active ? 'text-ink' : 'text-ink/50'
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn('mx-2 h-px flex-1 sm:mx-4', done ? 'bg-primary' : 'bg-ink/12')}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
