import { UserPlus } from 'lucide-react';
import { Section, Button } from '@/components/ui';
import AdvocateGrid from './AdvocateGrid';
import { getAllAdvocates } from '@/lib/advocates';
import { servesCity } from '@/utils/advocateCity';

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
  const all = await getAllAdvocates();
  // Includes lawyers who merely work here, not only those based here — see
  // servesCity. Matching on the base city alone hid most of a city's lawyers.
  const advocates = (city ? all.filter((a) => servesCity(a, city.name)) : all).slice(0, 12);

  return (
    <Section spacing="sm" className="bg-surface/55 pt-8 sm:pt-10">
      {/* A grid rather than a slider: three lawyers side by side can be
          compared, which is what a directory is for, and nothing is hidden
          behind an arrow the visitor has to discover. */}
      {advocates.length > 0 ? (
        <AdvocateGrid
          advocates={advocates}
          eyebrow="Advocate listing"
          title={
            city ? `Verified lawyers in ${city.name}` : 'Verified lawyers on Justiceland'
          }
          note="newest first"
          actionHref="/lawyers"
          actionLabel="Find all lawyers"
          // A city page is already scoped to a place, and a visitor reading
          // /bengaluru from Delhi wants Bengaluru — not their own doorstep.
          locationAware={!city}
        />
      ) : (
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
