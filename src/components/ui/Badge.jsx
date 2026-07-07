import { cn } from '@/utils/cn';

/**
 * Badge — compact status / tag label.
 *
 * @param {object} props
 * @param {string} [props.variant='neutral']  'neutral'|'primary'|'success'|'warning'|'secondary'
 * @param {string} [props.size='md']           'sm'|'md'
 * @param {import('react').ReactNode} [props.icon]
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
const VARIANTS = {
  neutral: 'bg-ink/5 text-ink/70',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({
  variant = 'neutral',
  size = 'md',
  icon,
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}
