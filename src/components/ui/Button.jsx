import Link from 'next/link';
import { cn } from '@/utils/cn';

/**
 * Button — polymorphic button/link with brand variants and sizes.
 * Renders a Next.js <Link> when `href` is provided, otherwise a <button>.
 *
 * @param {object} props
 * @param {string} [props.variant='primary']  'primary'|'secondary'|'outline'|'ghost'|'accent'
 * @param {string} [props.size='md']           'sm'|'md'|'lg'
 * @param {string} [props.href]                render as a link when set
 * @param {boolean} [props.fullWidth=false]
 * @param {import('react').ReactNode} [props.leftIcon]
 * @param {import('react').ReactNode} [props.rightIcon]
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
const BASE =
  'group/btn inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60';

/**
 * Filled buttons lift on hover instead of just darkening — a flat colour swap
 * reads as a state change, a lift reads as something you can press. The navy
 * carries a faint gradient so it doesn't look like a printed block.
 */
const VARIANTS = {
  primary:
    'bg-gradient-to-b from-primary-light/95 via-primary to-primary-dark text-white shadow-brand hover:-translate-y-0.5 hover:shadow-brand-hover active:translate-y-0 active:scale-[0.98]',
  secondary:
    'bg-gradient-to-b from-secondary-light/90 via-secondary to-secondary-dark text-white shadow-brand hover:-translate-y-0.5 hover:shadow-brand-hover active:translate-y-0 active:scale-[0.98]',
  accent:
    'bg-gradient-to-b from-[#E7C766] via-accent to-[#BC9A2E] text-[#241B02] shadow-gold hover:-translate-y-0.5 hover:brightness-[1.03] active:translate-y-0 active:scale-[0.98]',
  outline:
    'border border-ink/15 bg-surface text-ink shadow-sm hover:border-primary/60 hover:bg-primary/[0.04] hover:text-primary hover:shadow-card',
  ghost: 'text-ink/80 hover:bg-primary/[0.06] hover:text-primary',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base py-3.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}) {
  const classes = cn(
    BASE,
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className
  );

  const content = (
    <>
      {leftIcon}
      {children}
      {rightIcon}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {content}
    </button>
  );
}
