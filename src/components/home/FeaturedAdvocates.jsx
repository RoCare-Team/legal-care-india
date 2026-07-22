import { UserPlus } from 'lucide-react';
import { Section, Heading, Button } from '@/components/ui';
import FeaturedCarousel from './FeaturedCarousel';
import { getAllAdvocates } from '@/lib/advocates';

/**
 * FeaturedAdvocates — the most recently registered verified lawyers,
 * shown as a horizontal slider. Reads live from the database.
 */
export default async function FeaturedAdvocates() {
  const advocates = (await getAllAdvocates()).slice(0, 12);

  return (
    <Section className="mt-6 bg-surface/55 pt-8 sm:pt-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <Heading
          eyebrow="Verified Advocates"
          subtitle="Credentials checked against the Bar Council roll before a profile goes live."
        >
          Meet the Lawyers on Legal Care India
        </Heading>
        {advocates.length > 0 && (
          <Button href="/lawyers" variant="outline" size="sm" className="shrink-0">
            Browse all lawyers
          </Button>
        )}
      </div>

      {advocates.length > 0 ? (
        <FeaturedCarousel advocates={advocates} />
      ) : (
        <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-ink/15 bg-surface px-6 py-14 text-center">
          <UserPlus className="h-10 w-10 text-primary/60" aria-hidden="true" />
          <h3 className="mt-4 font-display text-lg font-semibold text-ink">
            Be the first advocate listed here
          </h3>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink/55">
            No practice has been listed yet. Add your Bar Council details, set your
            consultation fee and start taking clients from across India.
          </p>
          <Button href="/register" size="sm" className="mt-5">
            Register Your Practice
          </Button>
        </div>
      )}
    </Section>
  );
}
