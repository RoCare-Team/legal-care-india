import { cn } from '@/utils/cn';

/**
 * FormField — label + optional hint/error wrapper around a form control.
 * Keeps every form row visually consistent across registration & dashboard.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.htmlFor]
 * @param {boolean} [props.required=false]
 * @param {string} [props.hint]        helper text below the control
 * @param {string} [props.error]       error message (replaces hint when set)
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
export default function FormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  className,
  children,
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink/80">
          {label}
          {required && <span className="ml-0.5 text-primary">*</span>}
        </label>
      )}
      {children}
      {(error || hint) && (
        <p className={cn('text-xs', error ? 'text-red-600' : 'text-ink/50')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
