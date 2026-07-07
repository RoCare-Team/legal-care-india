import { Users } from 'lucide-react';
import { Section, Heading } from '@/components/ui';
import AdvocateCard from '@/components/cards/AdvocateCard';

/**
 * RelatedAdvocates — a grid of similar advocates shown at the bottom of a
 * public profile (same legal service or city).
 *
 * @param {object} props
 * @param {Array} props.advocates
 */
export default function RelatedAdvocates({ advocates = [] }) {
  if (advocates.length === 0) return null;

  return (
    <Section spacing="sm" className="border-t border-ink/8 bg-muted/30">
      <Heading level={2} size="text-2xl sm:text-3xl" eyebrow="Similar Advocates">
        <span className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" aria-hidden="true" />
          Related Advocates
        </span>
      </Heading>
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {advocates.map((advocate) => (
          <AdvocateCard key={advocate.id || advocate._id || advocate.slug} advocate={advocate} />
        ))}
      </div>
    </Section>
  );
}
