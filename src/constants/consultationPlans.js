/**
 * Live-chat consultation plans are fully defined by each advocate: they add
 * their own rows of { minutes, price } in the dashboard. The platform fixes
 * neither the durations nor the prices.
 */

/** Sensible bounds so a typo can't create a 10-day or ₹0 consultation. */
export const MIN_PLAN_MINUTES = 5;
export const MAX_PLAN_MINUTES = 480; // 8 hours
export const MAX_PLAN_PRICE = 100000;

/** "15 minutes" · "1 hour" · "1 hr 30 min" — a human label for a duration. */
export function formatDuration(minutes) {
  const m = Number(minutes) || 0;
  if (m < 60) return `${m} minutes`;
  const hours = Math.floor(m / 60);
  const rest = m % 60;
  const hourLabel = `${hours} hour${hours > 1 ? 's' : ''}`;
  return rest ? `${hourLabel} ${rest} min` : hourLabel;
}

/**
 * Clean a raw plan list (from a form or the DB) into valid, deduped, sorted
 * plans. Invalid rows are dropped; the shortest plan comes first.
 *
 * @param {Array<{minutes:any, price:any}>} [raw]
 * @returns {Array<{minutes:number, price:number}>}
 */
export function normalizePlans(raw = []) {
  const seen = new Set();
  return (raw || [])
    .map((p) => ({ minutes: Math.round(Number(p?.minutes)), price: Number(p?.price) }))
    .filter((p) => {
      if (!Number.isFinite(p.minutes) || !Number.isFinite(p.price)) return false;
      if (p.minutes < MIN_PLAN_MINUTES || p.minutes > MAX_PLAN_MINUTES) return false;
      if (p.price <= 0 || p.price > MAX_PLAN_PRICE) return false;
      if (seen.has(p.minutes)) return false; // one price per duration
      seen.add(p.minutes);
      return true;
    })
    .sort((a, b) => a.minutes - b.minutes);
}

/** The advocate's bookable plans, each with a display label. */
export function advocatePlans(consultationPlans = []) {
  return normalizePlans(consultationPlans).map((p) => ({
    ...p,
    id: `${p.minutes}min`,
    label: formatDuration(p.minutes),
  }));
}

/** Find one of an advocate's plans by duration, or null. */
export function getAdvocatePlan(consultationPlans, minutes) {
  const target = Math.round(Number(minutes));
  return advocatePlans(consultationPlans).find((p) => p.minutes === target) || null;
}
