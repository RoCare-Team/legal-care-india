'use client';

import Image from 'next/image';
import { Container } from '@/components/ui';
import { useCountUp } from '@/hooks/useCountUp';
import { formatCompactNumber } from '@/utils/formatters';
import { PLATFORM_STATS } from '@/data/stats';

/** Legal-themed backdrop (Bombay High Court, Wikimedia Commons). */
const LAW_BG =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Mumbai_03-2016_41_Bombay_High_Court.jpg/1280px-Mumbai_03-2016_41_Bombay_High_Court.jpg';

/**
 * StatItem — a single animated metric that counts up when scrolled into view.
 */
function StatItem({ value, suffix, label }) {
  const [count, ref] = useCountUp(value);

  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-4xl font-bold leading-none text-white sm:text-5xl">
        {formatCompactNumber(count)}
        <span className="text-gold">{suffix}</span>
      </p>
      <span className="rule-gold mx-auto mt-3 block h-px w-10" aria-hidden="true" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/65 sm:text-[13px]">
        {label}
      </p>
    </div>
  );
}

/**
 * Stats — headline platform metrics band over a subtle courthouse backdrop.
 */
export default function Stats() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-primary to-secondary py-16">
      {/* Legal-themed background photo */}
      <Image
        src={LAW_BG}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        aria-hidden="true"
      />
      {/* Brand overlay keeps the metrics readable while the courthouse shows through */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-secondary/90" />
      {/* Subtle dotted texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.05]" />

      {/* Gold hairlines top and bottom — frames the band like a letterhead rule
          instead of letting it float as a plain coloured stripe. */}
      <span className="rule-gold absolute inset-x-0 top-0 h-px opacity-70" aria-hidden="true" />
      <span className="rule-gold absolute inset-x-0 bottom-0 h-px opacity-70" aria-hidden="true" />

      <Container className="relative">
        <div className="grid grid-cols-2 gap-y-10 sm:gap-8 md:grid-cols-4">
          {PLATFORM_STATS.map((stat) => (
            <StatItem key={stat.id} {...stat} />
          ))}
        </div>
      </Container>
    </section>
  );
}
