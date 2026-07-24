import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui';
import { cn } from '@/utils/cn';

/**
 * PageHeader — a premium dark-teal gradient banner for interior pages, matching
 * the homepage hero. Includes an optional breadcrumb, eyebrow, title, subtitle,
 * a right-aligned actions slot and a content slot below (e.g. filters).
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
        'relative overflow-hidden border-b border-[#0F172A] bg-gradient-to-br from-[#1E3A5F] via-[#1E3A5F] to-[#0F172A] text-white',
        className
      )}
    >
      {/* Subtle dotted watermark pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03]" />
      {/* Soft ambient glows */}
      <div className="pointer-events-none absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-[#D4AF37]/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-10 h-[300px] w-[300px] rounded-full bg-[#34557F]/20 blur-[100px]" />

      <Container className="relative z-10 py-12 sm:py-16">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="animate-fade-up mb-5">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-300/70">
              {breadcrumbs.map((crumb, i) => (
                <li key={crumb.label} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition-colors hover:text-white">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-white">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {eyebrow && (
              <span
                className="animate-fade-up mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3.5 py-1 text-xs font-medium uppercase tracking-wider text-[#D4AF37] backdrop-blur-sm"
                style={{ animationDelay: '0.05s' }}
              >
                {eyebrow}
              </span>
            )}
            <h1
              className="animate-fade-up font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
              style={{ animationDelay: '0.1s' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="animate-fade-up mt-4 max-w-2xl text-base leading-8 text-slate-300"
                style={{ animationDelay: '0.15s' }}
              >
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
