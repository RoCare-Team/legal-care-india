/**
 * Booking/enquiry status — set by the advocate on their dashboard and shown
 * to the user on their account page.
 *
 *   new       — advocate hasn't responded yet (default). User sees "No response yet".
 *   pending   — advocate is reviewing the request.
 *   confirmed — advocate confirmed the consultation.
 *   declined  — advocate can't take it up.
 */
export const ENQUIRY_STATUSES = ['new', 'pending', 'confirmed', 'declined'];

/** Options the advocate can pick in the dashboard dropdown. */
export const ADVOCATE_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Booked' },
  { value: 'declined', label: 'Declined' },
];

/** How each status reads on the USER's side, with colour tokens. */
export const USER_STATUS_META = {
  new: { label: 'No response yet', tone: 'bg-ink/10 text-ink/55' },
  pending: { label: 'Pending', tone: 'bg-amber-500/15 text-amber-700' },
  confirmed: { label: 'Booked', tone: 'bg-emerald-500/15 text-emerald-700' },
  declined: { label: 'Declined', tone: 'bg-red-500/15 text-red-700' },
};

/** Colour tokens for the advocate-side status pill/select. */
export const ADVOCATE_STATUS_META = {
  new: { label: 'New', tone: 'bg-primary/10 text-primary' },
  pending: { label: 'Pending', tone: 'bg-amber-500/15 text-amber-700' },
  confirmed: { label: 'Booked', tone: 'bg-emerald-500/15 text-emerald-700' },
  declined: { label: 'Declined', tone: 'bg-red-500/15 text-red-700' },
};
