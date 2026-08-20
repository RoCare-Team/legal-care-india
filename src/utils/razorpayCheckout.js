/**
 * Razorpay Checkout loader (browser only).
 *
 * Checkout has to come from Razorpay's own CDN — it is not an npm package, and
 * a self-hosted copy would break the moment they change it. The script is
 * fetched on first use rather than in the page head so that people who never
 * open the wallet never pay for it.
 */

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let loader = null;

/** Resolves true once window.Razorpay exists, false if the script won't load. */
export function loadRazorpayCheckout() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  // One shared promise: two clicks in a row must not inject two scripts.
  if (loader) return loader;

  loader = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    const script = existing || document.createElement('script');

    script.addEventListener('load', () => resolve(Boolean(window.Razorpay)));
    script.addEventListener('error', () => {
      // Let a later attempt retry — the failure may have been a dead network.
      loader = null;
      script.remove();
      resolve(false);
    });

    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return loader;
}
