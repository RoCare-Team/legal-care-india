import { cn } from '@/utils/cn';

/**
 * ProfileSection — a titled, anchorable card block used for every section
 * of the public lawyer profile (About, Education, Reviews, FAQ, etc.).
 *
 * `scroll-mt` clears the navbar and the sticky tab row, so a tab lands on the
 * section's title rather than under the tabs.
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
        'scroll-mt-[140px] rounded-2xl border border-ink/8 bg-surface p-5 shadow-[0_1px_2px_rgba(30,58,95,0.04),0_10px_28px_-20px_rgba(30,58,95,0.25)] sm:p-7',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-ink/[0.06] pb-4 sm:mb-5">
        <h2 className="flex items-center gap-3 font-display text-[19px] font-semibold text-ink sm:text-[21px]">
          {Icon && (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/[0.07] text-primary">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
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
