/**
 * Discounts an admin grants on a consultation.
 *
 * A session is billed by the second at the lawyer's own rate and settled once,
 * when it ends. A discount is therefore not a payment: it is an instruction
 * left on the session that `settleCharges` reads at the moment it moves the
 * money. Set one while a session is still running and the client is charged
 * less when it finishes; clear it and the session settles as normal.
 *
 * Who pays for it: JusticeLand's commission first, the lawyer only after that
 * is used up. A discount of up to 30% (see COMMISSION_RATE) therefore costs
 * the lawyer nothing at all — it comes out of what we would have kept. Past
 * that there is nothing left of our share to give away, so the rest does come
 * out of the lawyer's, which is why every screen that offers a discount shows
 * what the lawyer will be paid before it is applied. Nothing here can make the
 * platform pay out more than it collected on a session.
 */

import { round2, splitEarning } from '@/constants/payouts';

/** 'percent' — a share of the bill; 'flat' — a fixed number of rupees off. */
export const DISCOUNT_KINDS = ['percent', 'flat'];

export const MAX_DISCOUNT_PERCENT = 100;

/** A flat discount bigger than any plausible session is a typo, not a gift. */
export const MAX_DISCOUNT_FLAT = 50000;

/** The longest note an admin can leave with a discount. */
export const MAX_DISCOUNT_NOTE = 200;

/**
 * A discount from form or API input, or null when there is nothing usable.
 *
 * Returns null rather than throwing on the shapes that simply mean "no
 * discount" (missing, zero); a value that is present but out of range throws,
 * because silently dropping a 900% typo would settle the session at full price
 * while the admin believed they had discounted it.
 *
 * @param {{kind?:string, value?:any, note?:any}} input
 * @returns {{kind:'percent'|'flat', value:number, note:string}|null}
 */
export function normalizeDiscount(input) {
  if (!input) return null;
  const kind = DISCOUNT_KINDS.includes(input.kind) ? input.kind : 'percent';
  const raw = Number(input.value);
  if (!Number.isFinite(raw) || raw <= 0) return null;

  const value = round2(raw);
  const max = kind === 'percent' ? MAX_DISCOUNT_PERCENT : MAX_DISCOUNT_FLAT;
  if (value > max) {
    const e = new Error(
      kind === 'percent'
        ? 'A discount cannot be more than 100%.'
        : `A flat discount cannot be more than ₹${MAX_DISCOUNT_FLAT.toLocaleString('en-IN')}.`
    );
    e.status = 400;
    throw e;
  }

  return {
    kind,
    value,
    note: String(input.note || '').trim().slice(0, MAX_DISCOUNT_NOTE),
  };
}

/**
 * What comes off a bill of `billed` rupees, never more than the bill itself.
 *
 * @param {number} billed
 * @param {{kind:string, value:number}|null} discount
 * @returns {number}
 */
export function discountOff(billed, discount) {
  const bill = round2(billed);
  if (!discount || bill <= 0) return 0;
  const value = Number(discount.value) || 0;
  if (value <= 0) return 0;
  const off = discount.kind === 'flat' ? value : (bill * value) / 100;
  return round2(Math.min(bill, Math.max(0, off)));
}

/** "20% off" / "₹50 off" — the label used wherever a discount is shown. */
export function describeDiscount(discount) {
  if (!discount) return '';
  const value = Number(discount.value) || 0;
  if (value <= 0) return '';
  return discount.kind === 'flat'
    ? `₹${round2(value).toLocaleString('en-IN')} off`
    : `${round2(value)}% off`;
}

/**
 * How one settled session divides up, discount and all.
 *
 * `billed` is what the session came to before any discount; `collected` is
 * what the client's wallet could actually give up (they can differ when a
 * wallet was spent elsewhere mid-session — see settleCharges). The split is
 * worked out on `collected + saved`, which is the bill the client would have
 * paid had we not discounted it, so a session with no discount comes out
 * exactly as it always did.
 *
 * @param {number} billed
 * @param {number} collected
 * @param {{kind:string, value:number}|null} discount
 */
export function settlementSplit(billed, collected, discount) {
  const bill = round2(Math.max(0, billed));
  const saved = discountOff(bill, discount);
  const paid = round2(Math.max(0, collected));

  // What the lawyer's share is worked out on: what came in, plus what we chose
  // to let the client keep. A wallet shortfall is not a discount and is not
  // added back here — nobody decided to give that away.
  const base = splitEarning(round2(paid + saved));

  // Our commission takes the discount first; only what will not fit comes out
  // of the lawyer's share.
  const fromAdvocate = round2(Math.max(0, saved - base.commission));
  const earning = round2(Math.max(0, base.earning - fromAdvocate));
  const commission = round2(paid - earning);

  return {
    /** The bill before the discount. */
    billed: bill,
    /** Taken off the client's bill. */
    saved,
    /** What the client actually paid. */
    collected: paid,
    /** Credited to the lawyer. */
    earning,
    /** What JusticeLand kept — the discount comes out of this first. */
    commission,
    /** How much of the discount the lawyer ended up funding (0 when it fits). */
    fromAdvocate,
    /** The gross the lawyer's share was worked out on. */
    gross: base.gross,
  };
}

/**
 * The same sum, run forwards for a screen: what a discount would do to a bill
 * that is still running, assuming the client's wallet covers it.
 *
 * @param {number} billed
 * @param {{kind:string, value:number}|null} discount
 */
export function previewDiscount(billed, discount) {
  const bill = round2(Math.max(0, billed));
  const saved = discountOff(bill, discount);
  return settlementSplit(bill, round2(bill - saved), discount);
}
