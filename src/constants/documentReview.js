/**
 * Document reviews — the two ways a client can have a legal document checked.
 *
 *  - AI review: an AI reads the document and lists risks, red flags and
 *    missing clauses in about a minute. One flat price.
 *  - Lawyer review: a verified lawyer reads it and writes a report. Priced
 *    by the page.
 * Both are paid online through Razorpay when the request is made.
 */

/** Flat price of an instant AI review, whatever the length, in rupees. */
export const AI_REVIEW_FEE = 199;

/** Longest document the AI review takes. */
export const AI_MAX_PAGES = 50;

/**
 * A lawyer review is priced by the page: the first slab's rate up to its page
 * count, and the cheaper rate for every page once the document is longer.
 */
export const LAWYER_RATE = 149;
export const LAWYER_RATE_LONG = 99;
export const LAWYER_LONG_FROM = 11;

/** What a lawyer review of `pages` pages costs, in rupees. */
export function lawyerReviewPrice(pages) {
  const n = Math.max(1, Math.round(Number(pages) || 1));
  return n * (n >= LAWYER_LONG_FROM ? LAWYER_RATE_LONG : LAWYER_RATE);
}

/** How soon a lawyer's written report is promised, in hours. */
export const EXPERT_REVIEW_HOURS = 24;

/** Accepted uploads: PDF, JPG, PNG up to 5 MB — the same as verification documents. */
export const REVIEW_MAX_BYTES = 5 * 1024 * 1024;
export const REVIEW_ACCEPT = 'application/pdf,image/jpeg,image/png';

/** What kind of document it is, so the right lawyer can be assigned. */
export const REVIEW_AREAS = [
  { value: 'property', label: 'Property (sale deed, rent / lease agreement)' },
  { value: 'corporate', label: 'Business (contract, NDA, partnership, MoU)' },
  { value: 'employment', label: 'Employment (offer letter, appointment, exit)' },
  { value: 'family', label: 'Family (will, gift deed, settlement)' },
  { value: 'notice', label: 'Legal notice or court paper' },
  { value: 'other', label: 'Something else' },
];

export const EXPERT_STATUS = {
  pending: { label: 'Awaiting payment', tone: 'bg-ink/8 text-ink/55' },
  paid: { label: 'Paid · awaiting lawyer', tone: 'bg-amber-500/10 text-amber-700' },
  done: { label: 'Report ready', tone: 'bg-emerald-500/10 text-emerald-700' },
  assigned: { label: 'Lawyer reviewing', tone: 'bg-sky-500/10 text-sky-700' },
  delivered: { label: 'Report ready', tone: 'bg-emerald-500/10 text-emerald-700' },
  cancelled: { label: 'Cancelled', tone: 'bg-red-500/10 text-red-600' },
};

export const RISK_META = {
  low: { label: 'Low risk', tone: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20' },
  medium: { label: 'Medium risk', tone: 'bg-amber-500/10 text-amber-700 ring-amber-500/25' },
  high: { label: 'High risk', tone: 'bg-red-500/10 text-red-600 ring-red-500/25' },
};
