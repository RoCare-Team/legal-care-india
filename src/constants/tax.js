/**
 * The tax this platform charges, in one place.
 *
 * Two unrelated things are now sold here — a lawyer's listing plan and a
 * fixed-price legal service — and both are services under GST at the same
 * rate. Defining it twice would mean a rate change that lands on one and not
 * the other, and the gap would surface as a mismatched invoice rather than as
 * an error anybody notices.
 */

/** 18% on a service, which is what everything sold here is. */
export const GST_RATE = 0.18;

/**
 * Tax on an amount, to whole rupees.
 *
 * Rounded rather than truncated because the figure appears on an invoice
 * beside a base and a total that must add up: a stray paisa in either
 * direction is a receipt whose three lines disagree.
 *
 * @param {number} base  rupees, before tax
 * @returns {number} rupees
 */
export function gstOn(base) {
  return Math.round((Number(base) || 0) * GST_RATE);
}
