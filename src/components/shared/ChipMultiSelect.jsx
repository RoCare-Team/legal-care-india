'use client';

import { useMemo, useState } from 'react';
import { Check, Lock, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * ChipMultiSelect — accessible toggleable chip group for selecting many
 * values from a fixed list (legal services, cities, courts, languages).
 *
 * Above `SEARCHABLE_FROM` options it grows a search box and stops rendering
 * everything at once. That threshold is not cosmetic: the city list is over a
 * hundred entries, and laid out as chips it was a wall roughly two thousand
 * pixels tall in the middle of a form — the section beneath it was, in
 * practice, undiscoverable, and finding "Jaipur" in it meant reading rather
 * than looking. Selected chips always stay visible, whatever the filter says,
 * so nothing a lawyer has picked can be scrolled or filtered out of sight.
 *
 * @param {object} props
 * @param {string[]} props.options
 * @param {string[]} props.value      currently selected values
 * @param {(next:string[])=>void} props.onChange
 * @param {number} [props.max]        optional selection cap
 * @param {(option:string)=>void} [props.onBlocked]
 *   Called when someone tries to add one past `max`. Without it a capped chip
 *   is simply disabled — which reads as broken, because the click does nothing
 *   and nothing says why. With it the cap can answer for itself.
 * @param {string} [props.searchLabel]  placeholder for the search box
 */
const SEARCHABLE_FROM = 24;
/** How many unselected chips to show before "show all". */
const COLLAPSED_COUNT = 18;

export default function ChipMultiSelect({
  options, value = [], onChange, max, onBlocked, searchLabel = 'Search…',
}) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const searchable = options.length > SEARCHABLE_FROM;

  const toggle = (option) => {
    const selected = value.includes(option);
    if (selected) {
      onChange(value.filter((v) => v !== option));
      return;
    }
    if (!max || value.length < max) {
      onChange([...value, option]);
      return;
    }
    // At the cap. Whoever set the cap decides what to say about it.
    onBlocked?.(option);
  };

  const { shown, hiddenCount } = useMemo(() => {
    if (!searchable) return { shown: options, hiddenCount: 0 };

    const q = query.trim().toLowerCase();
    const selected = options.filter((o) => value.includes(o));
    const rest = options.filter(
      (o) => !value.includes(o) && (!q || o.toLowerCase().includes(q))
    );

    // A search is a request to see what matches, so it overrides the collapse.
    // Otherwise only the first slice is drawn and the count says what is left.
    const visibleRest = q || expanded ? rest : rest.slice(0, COLLAPSED_COUNT);
    return {
      shown: [...selected, ...visibleRest],
      hiddenCount: rest.length - visibleRest.length,
    };
  }, [options, value, query, expanded, searchable]);

  return (
    <div>
      {searchable && (
        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className="w-full rounded-xl border border-ink/15 bg-surface py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {shown.map((option) => {
          const active = value.includes(option);
          const capped = !active && Boolean(max) && value.length >= max;
          // Only truly dead when nobody is listening. A locked chip that has an
          // `onBlocked` still takes the click — that click is how the lawyer
          // finds out the limit exists and what lifts it.
          const dead = capped && !onBlocked;
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              disabled={dead}
              aria-pressed={active}
              title={capped ? 'Your plan does not cover another one' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : capped
                    ? 'border-dashed border-ink/20 text-ink/40 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800'
                    : 'border-ink/15 text-ink/70 hover:border-primary/40 hover:text-ink',
                dead && 'cursor-not-allowed opacity-40'
              )}
            >
              {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              {capped && <Lock className="h-3 w-3" aria-hidden="true" />}
              {option}
            </button>
          );
        })}

        {searchable && !query && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/25 px-3 py-1.5 text-sm font-medium text-ink/55 transition-colors hover:border-primary/40 hover:text-primary"
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            Show {hiddenCount} more
          </button>
        )}
      </div>

      {searchable && query && shown.length === value.filter((v) => options.includes(v)).length && (
        <p className="mt-2 text-[12.5px] text-ink/45">
          Nothing matches “{query}”.
        </p>
      )}
    </div>
  );
}
