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
    // Light, between two hairlines: the figures carry the band, not a slab of
    // dark colour under the hero.
    <section className="relative border-y border-ink/[0.07] bg-white py-6 sm:py-7">
      <Container className="relative">
        <StatsCounters stats={stats} />
      </Container>
    </section>
  );
}
