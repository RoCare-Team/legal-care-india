import Link from 'next/link';
import { Landmark, MapPin, ArrowRight } from 'lucide-react';
import { Section } from '@/components/ui';
import { getAllCities } from '@/lib/cities';
import { cityPath } from '@/lib/serviceRoutes';
import { sameCity } from '@/utils/cityAliases';

/**
 * The towns and areas inside a city that have their own courts — Sohna and
 * Pataudi under Gurugram — each linking to its own page, which lists the
 * city's lawyers (see lawyerCityOf).
 *
 * On a city's page it lists that city's localities; on a locality's page, its
 * sister localities and the way back up to the city. Nothing renders when the
 * city has none.
 *
 * @param {object} props
 * @param {{name:string, slug:string, parent?:string}} props.city
 */
export default async function CityLocalities({ city }) {
  const all = await getAllCities();
  const parentName = city.parent || city.name;
  const parent = city.parent ? all.find((c) => !c.parent && sameCity(c.name, city.parent)) : city;
  const localities = all.filter((c) => c.parent && sameCity(c.parent, parentName) && c.slug !== city.slug);
  if (!localities.length) return null;

  return (
    <Section spacing="sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Courts &amp; areas</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink sm:text-[28px]">
            {city.parent ? `More areas in ${parentName}` : `Lawyers across ${parentName}`}
          </h2>
          <p className="mt-1.5 text-sm text-ink/60">
            Towns and areas in {parentName} district with their own courts.
          </p>
        </div>
        {city.parent && parent && (
          <Link
            href={cityPath(parent)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            All of {parentName}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {localities.map((l) => (
          <Link
            key={l.slug}
            href={cityPath(l)}
            className="group flex items-start gap-3 rounded-2xl border border-ink/8 bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/[0.07] text-primary">
              {l.court ? <Landmark className="h-5 w-5" aria-hidden="true" /> : <MapPin className="h-5 w-5" aria-hidden="true" />}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-ink group-hover:text-primary">Lawyers in {l.name}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-ink/55">{l.court || `${l.name}, ${parentName}`}</span>
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
