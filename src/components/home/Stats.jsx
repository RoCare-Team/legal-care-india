'use client';

import { Container } from '@/components/ui';
import { useCountUp } from '@/hooks/useCountUp';
import { formatCompactNumber } from '@/utils/formatters';
import { PLATFORM_STATS } from '@/data/stats';

/**
 * StatItem — a single animated metric that counts up when scrolled into view.
 */
function StatItem({ value, suffix, label }) {
  const [count, ref] = useCountUp(value);

  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-3xl font-semibold text-white sm:text-4xl">
        {formatCompactNumber(count)}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-white/70">{label}</p>
    </div>
  );
}

/**
 * Stats — headline platform metrics band on a brand gradient.
 */
export default function Stats() {
  return (
    <section className="bg-gradient-to-r from-primary to-secondary py-14">
      <Container>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {PLATFORM_STATS.map((stat) => (
            <StatItem key={stat.id} {...stat} />
          ))}
        </div>
      </Container>
    </section>
  );
}
