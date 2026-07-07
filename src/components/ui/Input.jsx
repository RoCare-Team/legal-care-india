import { cn } from '@/utils/cn';

/**
 * Input — themed text input with optional leading icon and error state.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.leftIcon]
 * @param {boolean} [props.invalid=false]
 * @param {string} [props.className]
 */
const CONTROL =
  'w-full rounded-xl border bg-surface text-sm text-ink placeholder:text-ink/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-muted/60';

export default function Input({ leftIcon, invalid = false, className, ...props }) {
  const control = (
    <input
      className={cn(
        CONTROL,
        'h-11 px-3.5',
        leftIcon && 'pl-10',
        invalid
          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
          : 'border-ink/15 focus:border-primary',
        className
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );

  if (!leftIcon) return control;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">
        {leftIcon}
      </span>
      {control}
    </div>
  );
}
