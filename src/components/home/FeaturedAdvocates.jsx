import { UserPlus } from 'lucide-react';
import { Section, Heading, Button } from '@/components/ui';
import FeaturedCarousel from './FeaturedCarousel';
import { getAllAdvocates } from '@/lib/advocates';

/**
 * FeaturedAdvocates — the most recently registered verified advocates,
 * shown as a horizontal slider. Reads live from the database.
 */
export default async function FeaturedAdvocates() {
  const advocates = (await getAllAdvocates()).slice(0, 12);

  return (
    <Section className="bg-surface/55 pt-8 sm:pt-10 mt-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <Heading
          eyebrow="Featured"
          subtitle="Verified advocates recently registered on Legal Care India."
        >
          Featured Advocates
        </Heading>
        {advocates.length > 0 && (
          <Button href="/advocates" variant="outline" size="sm" className="shrink-0">
            Browse all advocates
          </Button>
        )}
      </div>

      {advocates.length > 0 ? (
        <FeaturedCarousel advocates={advocates} />
      ) : (
        <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-ink/15 bg-surface px-6 py-14 text-center">
          <UserPlus className="h-10 w-10 text-primary/60" aria-hidden="true" />
          <h3 className="mt-4 font-semibold text-ink">Be the first advocate to join</h3>
          <p className="mt-1 max-w-sm text-sm text-ink/55">
            No advocates have registered yet. Create your profile and get discovered by clients
            across India.
          </p>
          <Button href="/register" size="sm" className="mt-5">
            Register as an Advocate
          </Button>
        </div>
      )}
    </Section>
  );
}
