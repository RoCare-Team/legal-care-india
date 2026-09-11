import { Gavel, MapPin, ChevronDown } from 'lucide-react';

/** Cities shown before the rest fold behind "Show all". */
const CITY_PREVIEW = 9;

/**
 * ProfileCoverage — where a lawyer can take a matter: the courts they appear in
 * and the cities they serve.
 *
 * These were two walls of chips in the header. For a lawyer serving twenty
 * cities that wall pushed their own facts and the About text half a screen
 * down, so they moved beside the body, in two small cards, with the city list
 * folded after the first few. The fold is a native <details>, so it opens
 * without any client JavaScript and every city is still in the page for search.
 *
 * Renders nothing when neither list has anything in it.
 *
 * @param {object} props
 * @param {object} props.advocate
 * @param {string} [props.className]
 */
export default function ProfileCoverage({ advocate, className = '' }) {
  const { courts = [], practiceCities = [], city } = advocate;
  const others = practiceCities.filter((c) => c && c !== city);
  if (courts.length === 0 && others.length === 0) return null;

  const shown = others.slice(0, CITY_PREVIEW);
  const folded = others.slice(CITY_PREVIEW);

  return (
    <div className={`space-y-5 ${className}`}>
      {courts.length > 0 && (
        <SideCard icon={Gavel} title="Practises in">
          <div className="flex flex-wrap gap-1.5">
            {courts.map((c) => (
              <span
                key={c}
                className="rounded-lg border border-primary/10 bg-primary/[0.05] px-2.5 py-1 text-[12.5px] font-medium text-primary"
              >
                {c}
              </span>
            ))}
          </div>
        </SideCard>
      )}

      {others.length > 0 && (
        <SideCard icon={MapPin} title="Serves clients in">
          <div className="flex flex-wrap gap-1.5">
            {city && (
              <span className="rounded-lg bg-primary px-2.5 py-1 text-[12.5px] font-semibold text-white">
                {city}
              </span>
            )}
            {shown.map((c) => (
              <CityChip key={c}>{c}</CityChip>
            ))}
          </div>

          {folded.length > 0 && (
            <details className="group mt-2">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md text-[12.5px] font-semibold text-primary hover:underline [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">+{folded.length} more cities</span>
                <span className="hidden group-open:inline">Show fewer</span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {folded.map((c) => (
                  <CityChip key={c}>{c}</CityChip>
                ))}
              </div>
            </details>
          )}
        </SideCard>
      )}
    </div>
  );
}

function CityChip({ children }) {
  return (
    <span className="rounded-lg border border-accent/25 bg-accent/[0.08] px-2.5 py-1 text-[12.5px] font-medium text-amber-800">
      {children}
    </span>
  );
}

/** The card every sidebar block on the profile shares. */
export function SideCard({ icon: Icon, title, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-ink/8 bg-surface p-5 shadow-[0_1px_2px_rgba(30,58,95,0.04),0_10px_28px_-20px_rgba(30,58,95,0.25)] ${className}`}
    >
      <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-ink">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/[0.07] text-primary">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}
