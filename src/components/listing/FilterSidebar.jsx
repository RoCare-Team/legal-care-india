'use client';

import { useMemo, useState } from 'react';
import {
  SlidersHorizontal, MapPin, LocateFixed, Loader2, X, ChevronDown, Star,
} from 'lucide-react';
import { CATEGORIES } from '@/data/categories';
import { cn } from '@/utils/cn';
import Select from '@/components/ui/Select';

/**
 * FilterSidebar — the listing's filters as a column beside the results.
 *
 * They used to be a bar across the top: six dropdowns in a row, which fitted
 * because each one hid its options until opened. A column shows the options
 * instead, and that is the point of moving them — the practice areas and the
 * languages are the two things a visitor scans to decide what to narrow by, and
 * a `<select>` makes you open it before you can scan anything.
 *
 * Every group writes into the same flat filter object the listing already
 * owned, through the same `onChange(partial)` it already used, so nothing about
 * how results are fetched or sorted changed with the layout.
 *
 * Below `lg` the column would push the results off the screen, so it collapses
 * to a single button that opens the same groups in a sheet.
 *
 * @param {object} props
 * @param {object} props.value            the filter object
 * @param {(partial: object) => void} props.onChange
 * @param {() => void} props.onReset
 * @param {boolean} props.hasActiveFilters
 * @param {Array} props.cities            [{ name }]
 * @param {Array} props.advocates         the unfiltered list, to build the
 *   language options from — a filter for a language nobody speaks is a dead end
 * @param {object} [props.userLocation]
 * @param {string} [props.locationLabel]
 * @param {boolean} [props.locating]
 * @param {string} [props.locationError]
 * @param {() => void} props.onUseMyLocation
 * @param {() => void} props.onClearLocation
 */

/** Distances offered once a position is known. */
const RADII = [5, 10, 25, 50, 100];

/** What a lawyer can be consulted through, and the rate field that proves it. */
const CONSULT_TYPES = [
  { value: 'chat', label: 'Chat', field: 'chatRate' },
  { value: 'audio', label: 'Audio Call', field: 'audioRate' },
  { value: 'video', label: 'Video Call', field: 'videoRate' },
  { value: 'office', label: 'In-Person', field: 'consultationFee' },
];

const AVAILABILITY = [
  { value: 'online', label: 'Available now' },
  { value: '', label: 'Any time' },
];

/** Fee ceilings, in rupees per minute. `''` is no ceiling. */
const FEES = [
  { value: '', label: 'Any' },
  { value: 25, label: 'Under ₹25' },
  { value: 50, label: 'Under ₹50' },
  { value: 100, label: 'Under ₹100' },
  { value: 200, label: 'Under ₹200' },
];

const RATINGS = [
  { value: '', label: 'Any' },
  { value: 4.5, label: '4.5+' },
  { value: 4, label: '4.0+' },
  { value: 3.5, label: '3.5+' },
];

/** One collapsible group. Open by default; the visitor can fold what they are done with. */
function Group({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-ink/8 py-3.5 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-[13px] font-bold text-ink">{title}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-ink/35 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && <div className="mt-2.5">{children}</div>}
    </div>
  );
}

/**
 * A radio row drawn as a checkbox, because only one value at a time is
 * meaningful here and clicking the checked one clears it — which a radio
 * cannot do and every filter list is expected to.
 */
function Choice({ checked, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className="group flex w-full items-center gap-2.5 rounded-lg px-1 py-[5px] text-left transition-colors hover:bg-primary/[0.04]"
    >
      <span
        className={cn(
          'grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[5px] border transition-colors',
          checked
            ? 'border-primary bg-primary text-white'
            : 'border-ink/25 bg-surface group-hover:border-primary/50'
        )}
      >
        {checked && (
          <svg viewBox="0 0 10 8" className="h-2 w-2.5 fill-none stroke-current stroke-[1.8]">
            <path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span
        className={cn(
          'min-w-0 truncate text-[13px] transition-colors',
          checked ? 'font-semibold text-ink' : 'text-ink/70 group-hover:text-ink'
        )}
      >
        {children}
      </span>
    </button>
  );
}

/** The groups themselves, shared by the column and the mobile sheet. */
function Groups({
  value, onChange, cities, advocates,
  userLocation, locationLabel, locating, locationError, onUseMyLocation, onClearLocation,
}) {
  // Only the languages somebody on this list actually speaks.
  const languages = useMemo(() => {
    const seen = new Map();
    for (const a of advocates || []) {
      for (const l of a.languages || []) {
        const key = String(l).trim();
        if (key) seen.set(key.toLowerCase(), key);
      }
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b)).slice(0, 10);
  }, [advocates]);

  const toggle = (field, next) => onChange({ [field]: value[field] === next ? '' : next });

  return (
    <>
      <Group title="Location">
        <Select
          size="sm"
          value={value.city}
          onChange={(e) => onChange({ city: e.target.value })}
          aria-label="City"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
          {value.city && !cities.some((c) => c.name === value.city) && (
            <option value={value.city}>{value.city}</option>
          )}
        </Select>

        {/* Distance is only a question once there is a point to measure from. */}
        {userLocation ? (
          <>
            <p className="mt-2 flex items-start gap-1.5 text-[11.5px] text-ink/55">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{locationLabel || 'Your location'}</span>
              <button
                type="button"
                onClick={onClearLocation}
                aria-label="Clear location"
                className="shrink-0 text-ink/35 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {RADII.map((km) => {
                const active = String(value.radius) === String(km);
                return (
                  <button
                    key={km}
                    type="button"
                    onClick={() => onChange({ radius: active ? '' : km })}
                    className={cn(
                      'rounded-lg border px-2 py-1 text-[11.5px] font-semibold transition-colors',
                      active
                        ? 'border-primary bg-primary text-white'
                        : 'border-ink/12 bg-surface text-ink/60 hover:border-primary/40 hover:text-primary'
                    )}
                  >
                    {km} km
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={locating}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/[0.04] px-3 py-2 text-[12.5px] font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-primary/[0.08] disabled:opacity-60"
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {locating ? 'Finding you…' : 'Use my location'}
          </button>
        )}
        {locationError && (
          <p className="mt-1.5 text-[11.5px] leading-snug text-red-600">{locationError}</p>
        )}
      </Group>

      <Group title="Practice Area">
        <div className="space-y-px">
          {CATEGORIES.map((c) => (
            <Choice
              key={c.slug}
              checked={value.service === c.slug}
              onClick={() => onChange({ service: value.service === c.slug ? '' : c.slug, subService: '' })}
            >
              {c.name}
            </Choice>
          ))}
        </div>
      </Group>

      <Group title="Consultation Type">
        {CONSULT_TYPES.map((t) => (
          <Choice
            key={t.value}
            checked={value.consult === t.value}
            onClick={() => toggle('consult', t.value)}
          >
            {t.label}
          </Choice>
        ))}
      </Group>

      <Group title="Availability">
        {AVAILABILITY.map((a) => (
          <Choice
            key={a.label}
            checked={(value.availability || '') === a.value}
            onClick={() => onChange({ availability: a.value })}
          >
            {a.label}
          </Choice>
        ))}
      </Group>

      {languages.length > 0 && (
        <Group title="Language">
          {languages.map((l) => (
            <Choice
              key={l}
              checked={(value.language || '').toLowerCase() === l.toLowerCase()}
              onClick={() => toggle('language', l)}
            >
              {l}
            </Choice>
          ))}
        </Group>
      )}

      <Group title="Fee Range">
        <p className="mb-1.5 text-[11.5px] text-ink/45">Per minute, cheapest live rate</p>
        {FEES.map((f) => (
          <Choice
            key={f.label}
            checked={String(value.maxFee ?? '') === String(f.value)}
            onClick={() => onChange({ maxFee: f.value })}
          >
            {f.label}
          </Choice>
        ))}
      </Group>

      <Group title="Rating">
        {RATINGS.map((r) => (
          <Choice
            key={r.label}
            checked={String(value.minRating ?? '') === String(r.value)}
            onClick={() => onChange({ minRating: r.value })}
          >
            <span className="inline-flex items-center gap-1">
              {r.value ? (
                <>
                  <Star className="h-3 w-3 fill-accent text-accent" aria-hidden="true" />
                  {r.label}
                </>
              ) : (
                r.label
              )}
            </span>
          </Choice>
        ))}
      </Group>
    </>
  );
}

export default function FilterSidebar(props) {
  const { hasActiveFilters, onReset } = props;
  const [sheetOpen, setSheetOpen] = useState(false);

  const header = (
    <div className="flex items-center justify-between gap-2 pb-3">
      <p className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
        <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
        Filters
      </p>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="text-[12px] font-semibold text-ink/45 transition-colors hover:text-red-600"
        >
          Reset
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* The column stays put while the results move. They are two lists of
          very different lengths — 391 lawyers against seven groups — and
          scrolling them as one means the filters have left the screen by the
          third card, exactly when a visitor decides to narrow.

          It gets its own scrollbar only if the groups outrun the viewport,
          and a thin one: this is a second scrollbar on the page and it should
          read as an edge, not as a control competing with the page's own.
          Nothing inside scrolls — the nested box the practice areas used to
          sit in is what made this feel cramped. */}
      <aside className="hidden lg:sticky lg:top-[88px] lg:block lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]">
        <div className="rounded-2xl border border-ink/8 bg-surface px-3.5 py-3 shadow-sm">
          {header}
          <Groups {...props} />
        </div>
      </aside>

      {/* Below lg: one button, and the same groups in a sheet. */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/12 bg-surface px-4 py-3 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-primary/40"
        >
          <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
          Filters
          {hasActiveFilters && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
              on
            </span>
          )}
        </button>

        {sheetOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <div
              className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
              onClick={() => setSheetOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                {header}
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close filters"
                  className="-mt-3 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/45 hover:bg-ink/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Groups {...props} />
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="mt-5 w-full rounded-xl bg-gradient-to-b from-[#E7C766] via-accent to-[#BC9A2E] py-3 text-sm font-semibold text-[#241B02] shadow-gold"
              >
                Show results
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
