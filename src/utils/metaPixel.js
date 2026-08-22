/**
 * Meta Pixel standard events.
 *
 * The pixel itself (PageView, on every route) is set up in
 * components/shared/MetaPixel. This is for the events that mean something
 * happened — a registration, a purchase — which must fire at the moment it
 * actually happens, never on page load. A CompleteRegistration sitting in the
 * page head would fire for every visitor on every view, and Meta would
 * optimise the ad spend against a number that means nothing.
 *
 * Safe to call anywhere: if the pixel is switched off (no env var, /admin, an
 * ad blocker) this quietly does nothing rather than throwing.
 */
export function trackMetaEvent(name, params) {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq !== 'function') return;
  try {
    window.fbq('track', name, params);
  } catch {
    // Tracking must never break the flow it is measuring.
  }
}
