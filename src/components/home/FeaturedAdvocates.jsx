import { UserPlus } from 'lucide-react';
import { Section, Heading, Button } from '@/components/ui';
import AdvocateCard from '@/components/cards/AdvocateCard';
import SectionReveal from '@/components/shared/SectionReveal';
import { getAllAdvocates } from '@/lib/advocates';

/**
 * FeaturedAdvocates — the most recently registered verified advocates.
 * Reads live from the database; shows a friendly prompt when none exist yet.
 */
export default async function FeaturedAdvocates() {
  const advocates = (await getAllAdvocates()).slice(0, 6);

  return (
    <Section className="bg-muted/50">
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
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {advocates.map((advocate, i) => (
  <SectionReveal key={advocate.slug} delay={i * 0.05}>
    <AdvocateCard advocate={advocate} />
  </SectionReveal>
))}
        </div>
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
