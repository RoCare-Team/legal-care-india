/**
 * Fixed consultation plans shown when a user books a chat with an advocate.
 * `id` is the stable key sent to the API; prices are in ₹.
 * Change these freely — the API validates the chosen plan against this list.
 */
export const CONSULTATION_PLANS = [
  { id: '15min', minutes: 15, price: 500, label: '15 minutes', tagline: 'Quick advice' },
  { id: '30min', minutes: 30, price: 800, label: '30 minutes', tagline: 'Discuss your matter' },
  { id: '60min', minutes: 60, price: 1000, label: '1 hour', tagline: 'Detailed consultation' },
  { id: '90min', minutes: 90, price: 1500, label: '90 minutes', tagline: 'In-depth session' },
];

/** Look up a plan by its id, or null. */
export function getPlan(id) {
  return CONSULTATION_PLANS.find((p) => p.id === id) || null;
}
