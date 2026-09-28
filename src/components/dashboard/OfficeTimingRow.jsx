'use client';

import { useState } from 'react';
import { FormField, Input } from '@/components/ui';
import { cn } from '@/utils/cn';
import { DAYS, parseDays, formatDays, parseHours, formatHours } from '@/utils/officeTiming';

/**
 * OfficeTimingRow — a day picker and a pair of time pickers for one row of
 * office hours, instead of two free-text boxes.
 *
 * The row still stores `day` and `hours` as the same plain strings it always
 * has ("Monday – Friday", "10:00 AM – 7:00 PM") — that is what the public
 * profile card reads (see ProfileContactCard) and what every seeded record
 * already holds, so nothing else has to change to use this. The picker only
 * changes how those two strings are written: ticking days composes one, and
 * the two time pickers compose the other.
 *
 * A string this cannot make sense of (typed by hand before this existed, or
 * an odd format) is not overwritten — the chips just start unselected and the
 * time pickers start blank, and the row's own preview line still shows
 * whatever text is actually saved, so a lawyer can see nothing was lost.
 */
const SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

export default function OfficeTimingRow({
  item,
  update,
  index,
  // Distinguishes the ids when two of these lists sit on the same page (Office
  // Timing and Usually Online both use this row) — otherwise both rows at the
  // same index would share one id, and a click on either label would always
  // focus the first list's field.
  idPrefix = 'timing',
  openLabel = 'Open on these days',
}) {
  const daySet = parseDays(item.day);
  const open = item.open !== false;

  // The two time pickers keep their own state rather than reading it fresh
  // from `item.hours` on every render. `formatHours` only produces a string
  // once BOTH are filled — while only one is, the saved `hours` is rightly
  // still '', and deriving the inputs from that empty string would reset the
  // very field just typed into back to blank before its other half is filled.
  const initial = parseHours(item.hours);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);

  const setTime = (which, value) => {
    const next = which === 'start' ? { start: value, end } : { start, end: value };
    (which === 'start' ? setStart : setEnd)(value);
    update({ hours: formatHours(next.start, next.end) });
  };

  const toggleDay = (day) => {
    const next = new Set(daySet);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    update({ day: formatDays(next) });
  };

  return (
    <div className="space-y-3.5">
      <div>
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-ink/55">Day(s)</p>
          <div className="flex gap-3 text-[11.5px] font-medium">
            <button type="button" onClick={() => update({ day: 'Monday – Friday' })} className="text-primary hover:underline">
              Weekdays
            </button>
            <button type="button" onClick={() => update({ day: 'Every day' })} className="text-primary hover:underline">
              Every day
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Days">
          {DAYS.map((d) => {
            const active = daySet.has(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() => toggleDay(d)}
                className={cn(
                  'h-8 min-w-[2.75rem] rounded-lg border px-2 text-[12.5px] font-semibold transition-colors',
                  active
                    ? 'border-primary bg-primary text-white'
                    : 'border-ink/15 bg-surface text-ink/60 hover:border-primary/40 hover:text-primary'
                )}
              >
                {SHORT[d]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Opens at" htmlFor={`d-${idPrefix}-start-${index}`}>
          <Input
            id={`d-${idPrefix}-start-${index}`}
            type="time"
            value={start}
            onChange={(e) => setTime('start', e.target.value)}
          />
        </FormField>
        <FormField label="Closes at" htmlFor={`d-${idPrefix}-end-${index}`}>
          <Input
            id={`d-${idPrefix}-end-${index}`}
            type="time"
            value={end}
            onChange={(e) => setTime('end', e.target.value)}
          />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/8 pt-3">
        <p className="text-[12px] text-ink/45">
          {item.day || 'No days picked'} · {item.hours || 'no hours set'}
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-ink/60">
          <input
            type="checkbox"
            checked={open}
            onChange={(e) => update({ open: e.target.checked })}
            className="h-4 w-4 rounded border-ink/25 text-primary focus:ring-primary/30"
          />
          {openLabel}
        </label>
      </div>
    </div>
  );
}
