import { cn } from '@/utils/cn';

/**
 * Textarea — themed multi-line input matching Input styling.
 *
 * @param {object} props
 * @param {boolean} [props.invalid=false]
 * @param {number} [props.rows=4]
 * @param {string} [props.className]
 */
export default function Textarea({ invalid = false, rows = 4, className, ...props }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-muted/60',
        invalid
          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
          : 'border-ink/15 focus:border-primary',
        className
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
