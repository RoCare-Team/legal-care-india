/**
 * FormSection — a titled group of fields inside a registration step.
 *
 * The steps were long lists of inputs with nothing to break them up. Grouping
 * them under a heading and a hairline gives the eye somewhere to rest and makes
 * a five-step form read as five short pages rather than one long one.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.description]  one line under the heading
 * @param {import('react').ReactNode} props.children
 */
export default function FormSection({ title, description, children }) {
  return (
    <section>
      <div className="border-b border-ink/8 pb-2">
        <h3 className="font-display text-[15px] font-bold text-ink">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs leading-snug text-ink/55">{description}</p>
        )}
      </div>
      <div className="pt-3">{children}</div>
    </section>
  );
}
