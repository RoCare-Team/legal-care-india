import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Select — themed native <select> with a custom chevron.
 * Pass either `options` (array of strings or {value,label}) or children.
 *
 * @param {object} props
 * @param {Array<string|{value:string,label:string}>} [props.options]
 * @param {string} [props.placeholder]
 * @param {boolean} [props.invalid=false]
 * @param {string} [props.className]
 */
export default function Select({
  options,
  placeholder,
  invalid = false,
  className,
  children,
  ...props
}) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-11 w-full appearance-none rounded-xl border bg-surface px-3.5 pr-10 text-sm text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-muted/60',
          invalid
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : 'border-ink/15 focus:border-primary',
          className
        )}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((opt) => {
              const value = typeof opt === 'string' ? opt : opt.value;
              const label = typeof opt === 'string' ? opt : opt.label;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })
          : children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
        aria-hidden="true"
      />
    </div>
  );
}
