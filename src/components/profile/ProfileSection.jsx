import { cn } from '@/utils/cn';

/**
 * ProfileSection — a titled, anchorable card block used for every section
 * of the public lawyer profile (About, Education, Reviews, FAQ, etc.).
 *
 * @param {object} props
 * @param {string} props.id            anchor id
 * @param {string} props.title
 * @param {import('react').ElementType} [props.icon]  Lucide icon component
 * @param {import('react').ReactNode} [props.action]   right-aligned slot
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
export default function ProfileSection({ id, title, icon: Icon, action, className, children }) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 rounded-2xl border border-ink/8 bg-surface p-6 shadow-card sm:p-8',
        className
      )}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-ink">
          {Icon && (
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
