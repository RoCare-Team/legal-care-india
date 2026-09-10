import { Container } from '@/components/ui';
import StatsCounters from './StatsCounters';
import { getPlatformStats } from '@/lib/stats';

/**
 * Stats — headline platform metrics band over a courthouse backdrop.
 *
 * The figures are counted from the database (see lib/stats), so they climb on
 * their own as lawyers register and clients sign up — nobody has to remember to
 * edit a number in code.
 *
 * The photo is pushed well back: at full strength the palms and rooftops ran
 * straight through the numbers. It reads as texture behind the band now, which
 * is all it was ever there to be.
 */
export default async function Stats({ city }) {
  const stats = await getPlatformStats(city);

  return (
    // No margins and little padding. Directly under the hero the strip reads
    // as the hero's own footer — the numbers behind the promise just made —
    // and a gap above would cut it loose from the thing it answers for.
    <section className="relative overflow-hidden bg-primary-dark py-6 sm:py-7">
      {/* A single wash for depth. The courthouse photograph and the dotted
          texture that used to sit here were for a band three times this tall;
          behind one line of figures they are noise. */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary/80 to-primary-dark" />
      {/* Gold hairlines top and bottom — frames the band like a letterhead rule
          instead of letting it float as a plain coloured stripe. */}
      <span className="rule-gold absolute inset-x-0 top-0 h-px opacity-70" aria-hidden="true" />
      <span className="rule-gold absolute inset-x-0 bottom-0 h-px opacity-70" aria-hidden="true" />

      <Container className="relative">
        <StatsCounters stats={stats} />
      </Container>
    </section>
  );
}
