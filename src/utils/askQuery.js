/**
 * Window event that opens the "ask a lawyer" popup from anywhere on the public
 * site — a band on a practice-area page, the floating button, an empty lawyer
 * list — without each of them importing the dialog.
 *
 * `detail` may carry `{ category, city }` to fill the form in for the visitor:
 * someone on the Property Law page asking a question is asking a property one.
 */
export const ASK_QUERY_EVENT = 'jl:ask-query';

/** @param {{ category?: string, city?: string, source?: string }} [detail] */
export function openAskQuery(detail = {}) {
  window.dispatchEvent(new CustomEvent(ASK_QUERY_EVENT, { detail }));
}
