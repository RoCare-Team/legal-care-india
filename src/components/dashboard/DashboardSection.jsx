import { cn } from '@/utils/cn';

/**
 * DashboardSection — anchorable titled card used for every editable block on
 * the Edit Profile page (matches the sidebar deep-link anchors).
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {import('react').ElementType} [props.icon]
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
export default function DashboardSection({ id, title, description, icon: Icon, className, children }) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-28 rounded-2xl border border-ink/8 bg-surface p-6 shadow-card',
        className
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-ink/55">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
