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
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60';

const VARIANTS = {
  primary: 'bg-primary text-white shadow-sm hover:bg-primary-dark active:scale-[0.98]',
  secondary: 'bg-secondary text-white shadow-sm hover:bg-secondary-dark active:scale-[0.98]',
  accent: 'bg-accent text-[#0B1220] shadow-sm hover:brightness-95 active:scale-[0.98]',
  outline: 'border border-ink/15 bg-surface text-ink hover:border-primary hover:text-primary',
  ghost: 'text-ink hover:bg-ink/5',
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
