import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui';
import { cn } from '@/utils/cn';

/**
 * PageHeader — a consistent gradient banner for interior pages, with an
 * optional breadcrumb, eyebrow, title, subtitle and right-aligned slot.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.eyebrow]
 * @param {string} [props.subtitle]
 * @param {Array<{label:string,href?:string}>} [props.breadcrumbs]
 * @param {import('react').ReactNode} [props.actions]
 * @param {string} [props.className]
 * @param {import('react').ReactNode} [props.children]  content below the header (e.g. filters)
 */
export default function PageHeader({
  title,
  eyebrow,
  subtitle,
  breadcrumbs = [],
  actions,
  className,
  children,
}) {
  return (
    <section
      className={cn(
        'border-b border-ink/8 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent',
        className
      )}
    >
      <Container className="py-10 sm:py-14">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-ink/50">
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.label} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-primary">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-ink/70">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow && (
              <span className="mb-2 inline-block text-sm font-semibold uppercase tracking-wider text-primary">
                {eyebrow}
              </span>
            )}
            <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink/60">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>

        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  );
}
