'use client';

import { Search, X, ChevronDown } from 'lucide-react';

/** SearchBox — text input with a search icon and a clear button. */
export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative flex-1 sm:min-w-[240px] sm:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-ink/12 bg-surface pl-9 pr-9 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-ink/40 hover:bg-ink/5 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * FilterSelect — styled dropdown.
 * @param {{value:string,onChange:(v:string)=>void,options:Array<{value:string,label:string}>,label?:string}} props
 */
export function FilterSelect({ value, onChange, options, label }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-10 cursor-pointer appearance-none rounded-xl border border-ink/12 bg-surface pl-3.5 pr-9 text-sm font-medium text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" aria-hidden="true" />
    </div>
  );
}
