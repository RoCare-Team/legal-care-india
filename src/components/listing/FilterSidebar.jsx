'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  SlidersHorizontal, MapPin, LocateFixed, Loader2, X, ChevronDown, Star, Check,
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
 * Below `lg` the column would push the results off the screen, so the same
 * groups open in a bottom sheet instead. The listing owns the button that opens
 * it (it sits beside Sort, in the results' own toolbar), so the sheet's open
 * state is passed in.
 *
 * @param {object} props
 * @param {object} props.value            the filter object
 * @param {(partial: object) => void} props.onChange
 * @param {() => void} props.onReset
 * @param {boolean} props.hasActiveFilters
 * @param {number} [props.activeCount]    how many filters are on, for the sheet title
 * @param {number} [props.resultCount]    lawyers matching right now, for "Show N lawyers"
 * @param {boolean} [props.sheetOpen]
 * @param {(open: boolean) => void} [props.onSheetOpenChange]
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
function Group({ title, children, defaultOpen = true, sheet = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn('border-t border-ink/8 first:border-t-0 first:pt-0', sheet ? 'py-4' : 'py-3.5')}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className={cn('font-bold text-ink', sheet ? 'text-[14.5px]' : 'text-[13px]')}>{title}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-ink/35 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {open && <div className={sheet ? 'mt-3' : 'mt-2.5'}>{children}</div>}
    </div>
  );
}

/** The wrapper a group's options sit in: a list in the column, wrapping chips in the sheet. */
function Options({ sheet, children }) {
  return <div className={sheet ? 'flex flex-wrap gap-2' : 'space-y-px'}>{children}</div>;
}

/**
 * One option. Only one value at a time is meaningful in each group, and
 * pressing the chosen one clears it — which a radio cannot do and every filter
 * list is expected to.
 *
 * In the column it is a row drawn as a checkbox. In the phone sheet it is a
 * chip: a 15px box beside a word is a fiddly thing to hit with a thumb, and a
 * wrapping row of chips fits twelve practice areas in a third of the height a
 * list of twelve rows took.
 */
function Choice({ checked, onClick, children, sheet = false }) {
  if (sheet) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={checked}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors',
          checked
            ? 'border-primary bg-primary text-white shadow-sm'
            : 'border-ink/12 bg-white text-ink/70 active:bg-primary/[0.06]'
        )}
      >
        {checked && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden="true" />}
        {children}
      </button>
    );
  }

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
  value, onChange, cities, advocates, sheet = false,
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
      <Group title="Location" sheet={sheet}>
        <Select
          size={sheet ? 'md' : 'sm'}
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
                      'rounded-lg border font-semibold transition-colors',
                      sheet ? 'px-3 py-1.5 text-[12.5px]' : 'px-2 py-1 text-[11.5px]',
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
            className={cn(
              'mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/25 bg-primary/[0.04] px-3 font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-primary/[0.08] disabled:opacity-60',
              sheet ? 'py-2.5 text-[13.5px]' : 'py-2 text-[12.5px]'
            )}
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

      {/* The value is the practice area's name, not its slug: the lawyers'
          records list specialisations by name, and the listing page turns a
          `?service=` slug from a link into the name before it gets here. The
          slug made every area match nobody. */}
      <Group title="Practice Area" sheet={sheet}>
        <Options sheet={sheet}>
          {CATEGORIES.map((c) => (
            <Choice
              key={c.slug}
              sheet={sheet}
              checked={value.service === c.name}
              onClick={() => onChange({ service: value.service === c.name ? '' : c.name, subService: '' })}
            >
              {c.name}
            </Choice>
          ))}
        </Options>
      </Group>

      <Group title="Consultation Type" sheet={sheet}>
        <Options sheet={sheet}>
          {CONSULT_TYPES.map((t) => (
            <Choice
              key={t.value}
              sheet={sheet}
              checked={value.consult === t.value}
              onClick={() => toggle('consult', t.value)}
            >
              {t.label}
            </Choice>
          ))}
        </Options>
      </Group>

      <Group title="Availability" sheet={sheet}>
        <Options sheet={sheet}>
          {AVAILABILITY.map((a) => (
            <Choice
              key={a.label}
              sheet={sheet}
              checked={(value.availability || '') === a.value}
              onClick={() => onChange({ availability: a.value })}
            >
              {a.label}
            </Choice>
          ))}
        </Options>
      </Group>

      {languages.length > 0 && (
        <Group title="Language" sheet={sheet}>
          <Options sheet={sheet}>
            {languages.map((l) => (
              <Choice
                key={l}
                sheet={sheet}
                checked={(value.language || '').toLowerCase() === l.toLowerCase()}
                onClick={() => toggle('language', l)}
              >
                {l}
              </Choice>
            ))}
          </Options>
        </Group>
      )}

      <Group title="Fee Range" sheet={sheet}>
        <p className="mb-2 text-[11.5px] text-ink/45">Per minute, cheapest live rate</p>
        <Options sheet={sheet}>
          {FEES.map((f) => (
            <Choice
              key={f.label}
              sheet={sheet}
              checked={String(value.maxFee ?? '') === String(f.value)}
              onClick={() => onChange({ maxFee: f.value })}
            >
              {f.label}
            </Choice>
          ))}
        </Options>
      </Group>

      <Group title="Rating" sheet={sheet}>
        <Options sheet={sheet}>
          {RATINGS.map((r) => (
            <Choice
              key={r.label}
              sheet={sheet}
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
        </Options>
      </Group>
    </>
  );
}

/**
 * The phone sheet. Portalled to <body>: the listing sits in a positioned
 * container with its own stacking order, and inside it the sheet drew *under*
 * the navbar and the floating WhatsApp and call buttons, which then sat on top
 * of the options.
 *
 * Three parts: a header that stays, the groups scrolling between, and a footer
 * that stays with the one thing everybody does last — see the results. The
 * footer's button says how many, so a visitor knows before closing whether they
 * have narrowed to nothing.
 */
function FilterSheet({ open, onClose, activeCount, resultCount, onReset, groupsProps }) {
  // No page scroll behind an open sheet, and Escape closes it.
  useEffect(() => {
    if (!open) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const showLabel =
    typeof resultCount === 'number'
      ? `Show ${resultCount} ${resultCount === 1 ? 'lawyer' : 'lawyers'}`
      : 'Show results';

  return createPortal(
    <div className="fixed inset-0 z-[90] flex flex-col justify-end lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <div
        className="absolute inset-0 animate-[sheet-fade_0.2s_ease-out] bg-ink/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex max-h-[88vh] animate-[sheet-up_0.28s_cubic-bezier(0.2,0.8,0.2,1)] flex-col rounded-t-[28px] bg-white shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.35)]">
        {/* Grab handle — a cue that this is a sheet over the page. */}
        <span className="mx-auto mt-2.5 block h-1.5 w-10 shrink-0 rounded-full bg-ink/15" aria-hidden="true" />

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink/8 px-5 pb-3.5 pt-3">
          <p className="flex items-center gap-2.5 font-display text-[18px] font-bold text-ink">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/[0.07] text-primary">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </span>
            Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 font-sans text-[11.5px] font-bold text-[#241B02]">
                {activeCount}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/[0.05] text-ink/60 transition-colors active:bg-ink/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div data-sheet-body className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1">
          <Groups {...groupsProps} sheet />
        </div>

        <div className="flex shrink-0 gap-3 border-t border-ink/8 bg-white px-5 pb-[max(env(safe-area-inset-bottom),14px)] pt-3.5">
          <button
            type="button"
            onClick={onReset}
            disabled={activeCount === 0}
            className="h-12 flex-1 rounded-xl border border-ink/15 bg-white text-[14px] font-semibold text-ink/75 transition-colors active:bg-ink/5 disabled:opacity-40"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-[1.6] rounded-xl bg-gradient-to-b from-[#E7C766] via-accent to-[#BC9A2E] text-[14.5px] font-bold text-[#241B02] shadow-gold"
          >
            {showLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function FilterSidebar(props) {
  const {
    hasActiveFilters, onReset, activeCount = 0, resultCount, sheetOpen = false, onSheetOpenChange,
  } = props;

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

      <FilterSheet
        open={sheetOpen}
        onClose={() => onSheetOpenChange?.(false)}
        activeCount={activeCount}
        resultCount={resultCount}
        onReset={onReset}
        groupsProps={props}
      />
    </>
  );
}
