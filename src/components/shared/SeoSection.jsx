import Link from 'next/link';
import SectionReveal from '@/components/shared/SectionReveal';

/**
 * The long-form blocks that sit beneath a listing or directory page.
 *
 * Grid pages — the lawyer directory, the city index, the service index — were
 * a heading and a wall of cards. To a reader arriving from a search that is a
 * page with nothing on it: no explanation of what these lawyers do, no help
 * choosing between them, nothing to answer the question that brought them.
 * These blocks are for that, and they are shared so the same page furniture
 * does not get rebuilt in five places with five slightly different headings.
 *
 * Every block renders a real `h2`, which is also what gives these pages the
 * heading structure they were missing.
 */

/**
 * A titled section with an optional lead paragraph.
 *
 * @param {object} props
 * @param {string} props.title      the section's `h2`
 * @param {string} [props.lead]     one paragraph under it
 * @param {string} [props.className]
 * @param {import('react').ReactNode} [props.children]
 */
export function SeoSection({ title, lead, className = 'mt-16', children }) {
  return (
    <SectionReveal>
      <section className={className}>
        <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
        {lead && (
          <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink/60">{lead}</p>
        )}
        {children}
      </section>
    </SectionReveal>
  );
}

/**
 * A grid of linked cards, each an `h3` and a line of explanation.
 *
 * Used for "which lawyer do I need" and "browse by city" style blocks, where
 * the point is as much the internal link as the words — these are how a
 * visitor (and a crawler) gets from an index page to the page that answers
 * them.
 *
 * @param {object} props
 * @param {Array<{href:string, title:string, text:string}>} props.items
 * @param {number} [props.columns=2]
 */
export function LinkCardGrid({ items = [], columns = 2 }) {
  if (!items.length) return null;

  return (
    <ul
      className={`mt-7 grid gap-3 ${columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}
    >
      {items.map(({ href, title, text }) => (
        <li key={href}>
          <Link
            href={href}
            className="group block h-full rounded-2xl border border-ink/8 bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover"
          >
            <h3 className="font-display text-base font-bold text-ink transition-colors group-hover:text-primary">
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{text}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Three short numbered cards — the "how it works" shape, reused rather than
 * rewritten each time a page needs to explain the same three steps.
 *
 * @param {object} props
 * @param {Array<{title:string, text:string}>} props.steps
 */
export function StepCards({ steps = [] }) {
  if (!steps.length) return null;

  return (
    <div className="mt-7 grid gap-5 sm:grid-cols-3">
      {steps.map(({ title, text }, i) => (
        <div key={title} className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
          <h3 className="font-display text-base font-bold text-ink">
            {i + 1}. {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">{text}</p>
        </div>
      ))}
    </div>
  );
}
