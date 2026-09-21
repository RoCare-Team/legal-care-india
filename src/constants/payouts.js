/**
 * How a lawyer's consultation money is split and paid out.
 *
 * Every paid session is split when it settles: JusticeLand keeps
 * COMMISSION_RATE of what the client paid, and the rest is credited to the
 * lawyer's earnings wallet. The wallet is what a lawyer can withdraw — payouts
 * are requested from the portal and transferred by an admin by hand.
 */

/** JusticeLand's share of every paid consultation. */
export const COMMISSION_RATE = 0.3;

/** "30%" — for labels. */
export const COMMISSION_LABEL = `${Math.round(COMMISSION_RATE * 100)}%`;

/** The smallest payout worth a bank transfer. */
export const MIN_PAYOUT = 100;

/** A lawyer keeps a short list, not a ledger of every account they ever had. */
export const MAX_BANK_ACCOUNTS = 3;

/** Indian Financial System Code: four letters, a zero, six letters or digits. */
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** Indian bank account numbers run from 9 to 18 digits. */
export const ACCOUNT_NUMBER_PATTERN = /^\d{9,18}$/;

/** Permanent Account Number: five letters, four digits, one letter. */
export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

/** Rupees to the paisa. Money here is never rounded to whole rupees silently. */
export function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/**
 * What a paid amount comes to for each side.
 *
 * The commission is rounded to the paisa and the lawyer's share is whatever
 * remains, so the two always add back up to exactly what the client paid.
 *
 * @param {number} gross  what the client was charged
 * @returns {{ gross: number, commission: number, earning: number }}
 */
export function splitEarning(gross) {
  const g = round2(gross);
  const commission = round2(g * COMMISSION_RATE);
  return { gross: g, commission, earning: round2(g - commission) };
}

/** "₹1,234.50" — paise only when there are some. */
export function formatMoney(value) {
  const n = round2(value);
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export const PAYOUT_STATUS = {
  requested: { label: 'Processing', tone: 'bg-amber-500/10 text-amber-700' },
  paid: { label: 'Paid', tone: 'bg-emerald-500/10 text-emerald-700' },
  rejected: { label: 'Rejected', tone: 'bg-red-500/10 text-red-600' },
  cancelled: { label: 'Cancelled', tone: 'bg-ink/10 text-ink/55' },
};
