'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import FullScreenLoader from '@/components/shared/FullScreenLoader';
import { useLocation } from '@/components/location/LocationProvider';
import { CATEGORIES } from '@/data/categories';
import { slugify } from '@/utils/slugify';

/**
 * SearchBar — the one control the home page is built around: which city, which
 * kind of lawyer, go.
 *
 * Both halves are dropdowns rather than text boxes, and that is a correctness
 * decision before it is a design one. A city only filters if it matches the
 * city a lawyer typed into their own registration form, and a practice area
 * only filters if it is one of the twelve the directory knows — a free-text
 * box happily accepts "Gurgoan" or "Divorce Lawyer" and returns nothing, with
 * no way for the visitor to tell a typo from an empty city.
 *
 * The city defaults to wherever the visitor turned out to be, so someone who
 * allowed the location prompt finds the box already filled in with their own
 * city rather than having to answer a question the browser just answered.
 *
 * @param {object} props
 * @param {string} [props.className]
 * @param {object} [props.city]  the city page this sits on, if any
 */

/**
 * How long the loader is held before the navigation is actually fired.
 *
 * In production the listing is pre-rendered and Next prefetches it, so the push
 * completes in a few milliseconds — the overlay would mount and unmount inside
 * one frame and the visitor would see nothing but an abrupt page swap. Holding
 * it briefly makes the search feel answered. In development, where the route
 * compiles on demand, the real wait is longer than this and the hold costs
 * nothing.
 */
const LOADER_HOLD_MS = 650;

export default function SearchBar({ className, city: pageCity }) {
  const router = useRouter();
  const { location, cities } = useLocation();

  const [city, setCity] = useState(pageCity?.name || '');
  const [service, setService] = useState('');

  // The listing page is server-rendered, so the click and the new page can be a
  // beat apart. Navigating inside a transition keeps `pending` true for exactly
  // that gap.
  const [pending, startTransition] = useTransition();
  // Shown from the moment of the click, not from the moment the route starts
  // resolving. Stays up until this component unmounts with the old page.
  const [searching, setSearching] = useState(false);
  const holdTimer = useRef(null);
  // Whether the visitor has taken charge of the box. Once they have, a location
  // arriving late must not overwrite what they chose.
  const touched = useRef(false);

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  // Fill in the detected city, but only if it is a city the directory actually
  // has — offering a place with no page behind it would send the search
  // somewhere with nothing in it.
  useEffect(() => {
    if (touched.current || pageCity || !location) return;
    const match = cities.find(
      (c) => slugify(c.name) === slugify(location.city || location.state || '')
    );
    if (match) setCity(match.name);
  }, [location, cities, pageCity]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (searching) return;

    const params = new URLSearchParams();
    if (service) {
      // The listing resolves a service by slug, which is also what the
      // category's own page uses, so the two cannot disagree.
      const match = CATEGORIES.find((c) => c.name === service);
      if (match) params.set('service', match.slug);
    }
    if (city.trim()) params.set('city', slugify(city));

    const href = `/lawyers${params.toString() ? `?${params}` : ''}`;
    setSearching(true);
    holdTimer.current = setTimeout(() => {
      startTransition(() => router.push(href));
    }, LOADER_HOLD_MS);
  };

  return (
    <>
      {/* The wait belongs on the screen, not tucked inside the button — the
          visitor's eyes are on the page, and a centred overlay also blocks a
          second submit while the listing loads. */}
      {(searching || pending) && <FullScreenLoader message="Finding lawyers for you" />}

      <form
        onSubmit={onSubmit}
        className={`flex flex-col gap-2 rounded-2xl bg-surface p-2 shadow-card sm:flex-row sm:items-center sm:gap-0 sm:p-1.5 ${className || ''}`}
      >
        <Field
          icon={MapPin}
          value={city}
          onChange={(v) => {
            touched.current = true;
            setCity(v);
          }}
          placeholder="Select city"
          ariaLabel="Choose a city"
          options={cities.map((c) => c.name)}
          className="sm:w-[38%]"
        />

        <span className="mx-1 hidden h-7 w-px bg-ink/10 sm:block" aria-hidden="true" />

        <Field
          icon={Search}
          value={service}
          onChange={(v) => {
            touched.current = true;
            setService(v);
          }}
          placeholder="Legal service, e.g. Family Law"
          ariaLabel="Choose a legal service"
          options={CATEGORIES.map((c) => c.name)}
          className="sm:flex-1"
        />

        <button
          type="submit"
          disabled={searching}
          aria-busy={searching}
          className="mt-1 h-12 shrink-0 rounded-xl bg-primary px-7 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70 sm:mt-0 sm:h-[3.25rem]"
        >
          Search
        </button>
      </form>
    </>
  );
}

/**
 * One half of the bar: an icon, a native select, and a chevron.
 *
 * A native `<select>` on purpose. It gets the platform's own picker — the
 * scrolling wheel on iOS, the full-screen list on Android — which handles a
 * hundred-and-twenty-city list better than anything built out of divs, and it
 * is reachable by keyboard and screen reader without any of it being written
 * here. The chevron is drawn separately because `appearance-none` is what
 * removes the browser's own, and that is the price of styling the rest.
 */
function Field({ icon: Icon, value, onChange, placeholder, ariaLabel, options, className }) {
  return (
    <label
      className={`relative flex items-center gap-2.5 rounded-xl px-3.5 transition-colors focus-within:bg-ink/[0.03] ${className || ''}`}
    >
      <Icon className="h-5 w-5 shrink-0 text-ink/35" aria-hidden="true" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={`h-12 w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent pr-6 text-sm focus:outline-none ${
          value ? 'font-semibold text-ink' : 'text-ink/45'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 h-4 w-4 text-ink/35"
        aria-hidden="true"
      />
    </label>
  );
}
