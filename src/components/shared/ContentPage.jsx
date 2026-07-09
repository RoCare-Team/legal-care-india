import { Container } from '@/components/ui';
import PageHeader from '@/components/shared/PageHeader';

/**
 * ContentPage — shared layout for long-form static pages (legal + info):
 * the premium PageHeader banner followed by a readable prose column.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.eyebrow]
 * @param {string} [props.subtitle]
 * @param {Array<{label:string,href?:string}>} [props.breadcrumbs]
 * @param {string} [props.updated]  optional "last updated" line
 * @param {import('react').ReactNode} props.children
 */
export default function ContentPage({ title, eyebrow, subtitle, breadcrumbs, updated, children }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} />
      <Container className="py-10 sm:py-14">
        <article className="prose-content mx-auto max-w-3xl">
          {updated && (
            <p className="!mb-8 text-sm text-ink/45">Last updated: {updated}</p>
          )}
          {children}
        </article>
      </Container>
    </>
  );
}
