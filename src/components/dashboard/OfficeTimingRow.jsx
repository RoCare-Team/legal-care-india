'use client';

import { useState } from 'react';
import { FormField, Input } from '@/components/ui';
import { cn } from '@/utils/cn';

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
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

/** "Monday – Friday" / "Mon, Wed" / "Everyday" -> the set of days it means. */
function parseDays(raw) {
  const s = String(raw || '').trim();
  if (!s) return new Set();
  if (/^every\s*day$/i.test(s) || /^daily$/i.test(s)) return new Set(DAYS);

  const findDay = (word) => {
    const w = word.trim().toLowerCase().slice(0, 3);
    return DAYS.find((d) => d.toLowerCase().startsWith(w));
  };

  const range = s.match(/^([A-Za-z]+)\s*(?:–|—|-|to)\s*([A-Za-z]+)$/i);
  if (range) {
    const from = DAYS.findIndex((d) => d === findDay(range[1]));
    const to = DAYS.findIndex((d) => d === findDay(range[2]));
    if (from >= 0 && to >= 0) {
      const set = new Set();
      for (let i = from; ; i = (i + 1) % 7) {
        set.add(DAYS[i]);
        if (i === to) break;
      }
      return set;
    }
  }

  const set = new Set();
  for (const part of s.split(/,|&|\band\b/i)) {
    const day = findDay(part);
    if (day) set.add(day);
  }
  return set;
}

/** The set of days -> the string that is saved. */
function formatDays(set) {
  const days = DAYS.filter((d) => set.has(d));
  if (days.length === 0) return '';
  if (days.length === 7) return 'Every day';

  const idx = days.map((d) => DAYS.indexOf(d)).sort((a, b) => a - b);
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  return contiguous && idx.length > 1
    ? `${DAYS[idx[0]]} – ${DAYS[idx[idx.length - 1]]}`
    : days.join(', ');
}

/** "10:00 AM – 7:00 PM" -> { start: '10:00', end: '19:00' } for <input type="time">. */
function parseHours(raw) {
  const m = String(raw || '').match(
    /(\d{1,2}):(\d{2})\s*([AaPp][Mm])\s*(?:–|—|-|to)\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])/
  );
  if (!m) return { start: '', end: '' };
  const to24 = (h, min, ap) => {
    let hour = Number(h) % 12;
    if (/pm/i.test(ap)) hour += 12;
    return `${String(hour).padStart(2, '0')}:${min}`;
  };
  return { start: to24(m[1], m[2], m[3]), end: to24(m[4], m[5], m[6]) };
}

/** { start: '10:00', end: '19:00' } -> "10:00 AM – 7:00 PM". */
function formatHours(start, end) {
  if (!start || !end) return '';
  const to12 = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  };
  return `${to12(start)} – ${to12(end)}`;
}

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
