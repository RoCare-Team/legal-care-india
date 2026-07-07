'use client';

import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * ChipMultiSelect — accessible toggleable chip group for selecting many
 * values from a fixed list (legal services, languages, etc.).
 *
 * @param {object} props
 * @param {string[]} props.options
 * @param {string[]} props.value      currently selected values
 * @param {(next:string[])=>void} props.onChange
 * @param {number} [props.max]        optional selection cap
 */
export default function ChipMultiSelect({ options, value = [], onChange, max }) {
  const toggle = (option) => {
    const selected = value.includes(option);
    if (selected) {
      onChange(value.filter((v) => v !== option));
    } else if (!max || value.length < max) {
      onChange([...value, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option);
        const disabled = !active && max && value.length >= max;
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            disabled={disabled}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-ink/15 text-ink/70 hover:border-primary/40 hover:text-ink',
              disabled && 'cursor-not-allowed opacity-40'
            )}
          >
            {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            {option}
          </button>
        );
      })}
    </div>
  );
}
