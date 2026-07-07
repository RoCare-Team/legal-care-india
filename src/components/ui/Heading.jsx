import { cn } from '@/utils/cn';

/**
 * Heading — typographic scale for section titles with an optional eyebrow
 * and supporting subtitle. Keeps headings visually consistent everywhere.
 *
 * @param {object} props
 * @param {1|2|3|4} [props.level=2]        semantic heading level
 * @param {string} [props.eyebrow]          small kicker above the title
 * @param {string} [props.subtitle]         supporting copy below the title
 * @param {boolean} [props.centered=false]
 * @param {string} [props.size]             override size class
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
const SIZES = {
  1: 'text-4xl sm:text-5xl lg:text-6xl',
  2: 'text-3xl sm:text-4xl',
  3: 'text-2xl sm:text-3xl',
  4: 'text-xl sm:text-2xl',
};

export default function Heading({
  level = 2,
  eyebrow,
  subtitle,
  centered = false,
  size,
  className,
  children,
  ...props
}) {
  const Tag = `h${level}`;

  return (
    <div className={cn(centered && 'text-center', className)}>
      {eyebrow && (
        <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </span>
      )}
      <Tag
        className={cn(
          'font-display font-semibold leading-tight text-ink',
          size || SIZES[level]
        )}
        {...props}
      >
        {children}
      </Tag>
      {subtitle && (
        <p
          className={cn(
            'mt-4 text-base leading-relaxed text-ink/60 sm:text-lg',
            centered && 'mx-auto max-w-2xl'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
