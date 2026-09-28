/**
 * Office timing — reading the plain strings a lawyer's timing rows are saved
 * as ("Monday – Friday", "10:00 AM – 7:00 PM") into days and times, and
 * turning them into bookable in-person visit slots.
 *
 * Shared by the dashboard's timing picker (which writes the strings), the
 * profile's visit booking (which offers slots) and the booking API (which
 * re-checks the slot), so all three agree on what a row means.
 */

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Length of one in-person visit slot, in minutes. */
export const VISIT_SLOT_MINUTES = 30;

/** How far ahead a visit can be booked. */
export const VISIT_BOOKING_DAYS = 30;

/** "Monday – Friday" / "Mon, Wed" / "Everyday" -> the set of days it means. */
export function parseDays(raw) {
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
export function formatDays(set) {
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
export function parseHours(raw) {
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

/** '14:30' -> '2:30 PM'. */
export function to12h(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
}

/** { start: '10:00', end: '19:00' } -> "10:00 AM – 7:00 PM". */
export function formatHours(start, end) {
  if (!start || !end) return '';
  return `${to12h(start)} – ${to12h(end)}`;
}

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};
const fromMinutes = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

/** 'YYYY-MM-DD' -> its weekday name, read as a calendar date (no timezone drift). */
export function weekdayOf(date) {
  const [y, mo, d] = String(date).split('-').map(Number);
  if (!y || !mo || !d) return '';
  const js = new Date(Date.UTC(y, mo - 1, d)).getUTCDay(); // 0 = Sunday
  return DAYS[(js + 6) % 7];
}

/** Today's date in India as 'YYYY-MM-DD' — visits are booked in office (IST) time. */
export function todayIST(now = new Date()) {
  const ist = new Date(now.getTime() + 330 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' plus n days. */
export function addDays(date, n) {
  const [y, mo, d] = String(date).split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d + n)).toISOString().slice(0, 10);
}

/**
 * The start times ('HH:mm') a visit can be booked at on `date`, from every
 * open timing row that covers that weekday and has hours this can read.
 * A row whose hours are free text ("By appointment") offers no slots.
 */
export function slotsForDate(timing = [], date) {
  const day = weekdayOf(date);
  if (!day) return [];
  const out = new Set();
  for (const row of timing || []) {
    if (!row || row.open === false) continue;
    if (!parseDays(row.day).has(day)) continue;
    const { start, end } = parseHours(row.hours);
    if (!start || !end) continue;
    const last = toMinutes(end) - VISIT_SLOT_MINUTES;
    for (let t = toMinutes(start); t <= last; t += VISIT_SLOT_MINUTES) out.add(fromMinutes(t));
  }
  return [...out].sort();
}

/**
 * The dates from tomorrow onwards, within the booking window, on which the
 * office has at least one slot. Today is left out on purpose: a same-day
 * visit leaves the lawyer no time to see the booking.
 */
export function bookableDates(timing = [], from = todayIST()) {
  const dates = [];
  for (let i = 1; i <= VISIT_BOOKING_DAYS; i += 1) {
    const date = addDays(from, i);
    if (slotsForDate(timing, date).length) dates.push(date);
  }
  return dates;
}

/** True when the timing rows describe at least one bookable slot in a week. */
export function hasBookableHours(timing = []) {
  return DAYS.some((_, i) => slotsForDate(timing, addDays('2024-01-01', i)).length > 0);
}

/**
 * Whether a lawyer can be booked for an office visit, from their raw record
 * (not the public profile, which invents an office and hours for display).
 * It takes all three: a fee, an office address, and hours with real times.
 *
 * @param {object} a  lean Advocate document
 */
export function inPersonOffer(a) {
  const fee = Math.round(Number(a?.consultationFee) || 0);
  const timing = Array.isArray(a?.timing) ? a.timing : [];
  const address = String(a?.office?.address || '').trim();
  return {
    available: fee > 0 && Boolean(address) && hasBookableHours(timing),
    fee,
    timing,
    office: {
      name: a?.office?.name || '',
      address,
      pincode: a?.office?.pincode || '',
    },
  };
}
