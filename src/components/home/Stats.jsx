import Image from 'next/image';
import { Container } from '@/components/ui';
import StatsCounters from './StatsCounters';
import { getPlatformStats } from '@/lib/stats';

/** Legal-themed backdrop (Bombay High Court, Wikimedia Commons). */
const LAW_BG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Mumbai_03-2016_41_Bombay_High_Court.jpg/1280px-Mumbai_03-2016_41_Bombay_High_Court.jpg';

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
export default async function Stats() {
  const stats = await getPlatformStats();

  return (
    <section className="relative overflow-hidden bg-primary-dark py-10 sm:py-12">
      {/* Legal-themed background photo */}
      <Image
        src={LAW_BG}
        alt=""
        fill
        sizes="100vw"
        className="scale-105 object-cover opacity-30 blur-[2px]"
        aria-hidden="true"
      />

      {/* Brand wash — deep navy at the edges, a touch lighter through the middle
          so the band has some depth rather than reading as a flat block. */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary/85 to-primary-dark" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/60 via-transparent to-primary-dark/70" />

      {/* Subtle dotted texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.04]" />

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
