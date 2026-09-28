import Link from 'next/link';
import { UserPlus, ArrowRight, Search, Wifi } from 'lucide-react';
import { Section, Button } from '@/components/ui';
import AdvocateGrid from './AdvocateGrid';
import { getAllAdvocates } from '@/lib/advocates';
import { toCardAdvocate } from '@/lib/advocateCard';
import { servesCity } from '@/utils/advocateCity';
import { CATEGORIES } from '@/data/categories';
import { getPlatformStats } from '@/lib/stats';

/** The practice areas people look for most, as quick ways into the directory. */
const QUICK_AREAS = ['family-lawyer', 'criminal-lawyer', 'property-lawyer', 'civil-lawyer', 'consumer-lawyer', 'labour-lawyer']
  .map((slug) => CATEGORIES.find((c) => c.slug === slug))
  .filter(Boolean);

/**
 * FeaturedAdvocates — the most recently registered verified lawyers,
 * shown as a horizontal slider. Reads live from the database.
 *
 * On a city page it lists that city's lawyers and nothing else. If none have
 * registered there, the band says so rather than filling the gap with lawyers
 * from other cities — someone reading /bengaluru is looking for Bengaluru, and
 * a Delhi card under a Bengaluru heading is the wrong answer however it is
 * labelled.
 *
 * Everywhere else — which in practice means the home page — the band narrows
 * itself to wherever the visitor turns out to be, as soon as they allow the
 * browser's location prompt. That swap happens in the client component below
 * (see `locationAware`), because this page is static and shared by everyone;
 * there is no visitor to render for at build time.
 *
 * @param {object} props
 * @param {object} [props.city]  the city this page is scoped to, if any
 */
export default async function FeaturedAdvocates({ city }) {
  const [all, stats] = await Promise.all([getAllAdvocates(), getPlatformStats(city)]);
  // The same lawyer figure the stats band shows, so the two never disagree.
  const lawyerCount = stats.find((st) => st.id === 'advocates')?.value || 0;
  // Includes lawyers who merely work here, not only those based here — see
  // servesCity. Matching on the base city alone hid most of a city's lawyers.
  const scoped = city ? all.filter((a) => servesCity(a, city.name)) : all;
  const advocates = scoped.slice(0, 12);

  return (
    <Section spacing="sm" className="bg-surface/55 pt-8 sm:pt-10">
      {/* A grid rather than a slider: three lawyers side by side can be
          compared, which is what a directory is for, and nothing is hidden
          behind an arrow the visitor has to discover. */}
      {advocates.length > 0 ? (
        <AdvocateGrid
          advocates={advocates.map(toCardAdvocate)}
          // The heading names the place, because that is what the band is
          // about. It is also what the online-aware rewrite works on: with
          // lawyers reachable right now it becomes "Top online lawyers in
          // Bengaluru", and without them it stays this.
          eyebrow={
            city ? `Verified lawyers in ${city.name}` : 'Verified lawyers on Justiceland'
          }
          note="newest first"
          actionHref="/lawyers"
          actionLabel="View all lawyers"
          // A city page is already scoped to a place, and a visitor reading
          // /bengaluru from Delhi wants Bengaluru — not their own doorstep.
          locationAware={!city}
        />
      ) : null}

      {/* The way into the whole directory, said plainly. Six cards and a small
          "View all" link read as the whole list; this panel makes it obvious
          there are hundreds more, and gives the quickest ways in. */}
      {advocates.length > 0 && (
        <div className="relative mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-primary-light p-6 text-white sm:p-8">
          <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.16em] text-accent">
                <Search className="h-3.5 w-3.5" aria-hidden="true" /> Explore the directory
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold sm:text-[1.7rem]">
                {Math.max(lawyerCount, scoped.length).toLocaleString('en-IN')}+ verified lawyers{city ? ` in ${city.name}` : ' across India'}
              </h3>
              <p className="mt-1.5 text-[14px] text-white/65">
                Filter by practice area, city, language, fee — or see who is online to talk right now.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_AREAS.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/lawyers/${c.slug}`}
                    className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[12.5px] font-semibold text-white/85 transition-colors hover:border-accent hover:bg-accent hover:text-primary-dark"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col">
              <Link
                href="/lawyers"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B8912A] via-[#D4AF37] to-[#B8912A] px-6 text-[15px] font-bold text-primary-dark shadow-gold transition-opacity hover:opacity-95"
              >
                Explore all lawyers <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/lawyers?availability=online"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-6 text-[14px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Wifi className="h-4 w-4 text-emerald-400" aria-hidden="true" /> Online now
              </Link>
            </div>
          </div>
        </div>
      )}

      {advocates.length === 0 && (
        <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-ink/15 bg-surface px-6 py-14 text-center">
          <UserPlus className="h-10 w-10 text-primary/60" aria-hidden="true" />
          <h3 className="mt-4 font-display text-lg font-semibold text-ink">
            {city ? `No lawyer listed in ${city.name} yet` : 'Be the first advocate listed here'}
          </h3>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink/55">
            {city
              ? `No verified lawyer has registered in ${city.name} so far. Practising here? Add your Bar Council details and be the first.`
              : 'No practice has been listed yet. Add your Bar Council details, set your consultation fee and start taking clients from across India.'}
          </p>
          <Button href="/register" size="sm" className="mt-5">
            Register Your Practice
          </Button>
        </div>
      )}
    </Section>
  );
}
