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
      {/* Eyebrow as a bordered chip with a gold marker — a bare coloured word
          gets lost above a large serif title. */}
      {eyebrow && (
        <span
          className={cn(
            'mb-3.5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary',
            centered && 'mx-auto'
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <Tag
        className={cn(
          'font-display font-semibold leading-[1.12] tracking-[-0.015em] text-ink',
          size || SIZES[level]
        )}
        {...props}
      >
        {children}
      </Tag>
      {/* Gold rule anchoring the title — the house signature, repeated at every
          section heading so the brand reads as deliberate. Skipped on bare
          headings (404, error pages), where a decorative flourish is noise. */}
      {(eyebrow || subtitle) && (
        <span
          className={cn('rule-gold mt-4 block h-px w-24 rounded-full', centered && 'mx-auto')}
          aria-hidden="true"
        />
      )}
      {subtitle && (
        <p
          className={cn(
            'mt-3.5 text-base leading-relaxed text-ink/60 sm:text-[17px]',
            centered && 'mx-auto max-w-2xl'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
