'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  X, Loader2, ShieldCheck, Wallet, Tag, Check, MessageCircle, CreditCard, CircleAlert,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { refreshAuth } from '@/utils/authEvents';
import { loadRazorpayCheckout } from '@/utils/razorpayCheckout';

/**
 * ServiceCheckout — buying a fixed-price service from its page.
 *
 * The same three steps the app uses, and the same endpoints: price it
 * (/api/marketplace/quote), open the order (/api/marketplace/orders), then let
 * the server confirm the payment (/api/marketplace/orders/verify). Nothing
 * here decides what anything costs. The figures shown are the server's, the
 * amount charged is the server's, and the order is marked paid only after the
 * server has checked Razorpay's signature, the payment and the amount — a
 * `handler` that fired in this browser proves none of that on its own.
 *
 * Buying needs a client account: orders belong to a user, and the wallet and
 * coupons are theirs. A signed-out visitor is sent to log in and back; a
 * lawyer is told plainly that this is a client purchase.
 *
 * @param {object} props
 * @param {{slug: string, title: string, price: number, category?: string}} props.service
 * @param {string} [props.waHref]  WhatsApp fallback, shown beside Pay now
 */
export default function ServiceCheckout({ service, waHref }) {
  const { role, user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const signedInAsClient = role === 'user';
  const loginHref = `/user/login?next=${encodeURIComponent(`/services/${service.slug}`)}`;

  return (
    <>
      {signedInAsClient || loading || !role ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (signedInAsClient) setOpen(true);
            else window.location.href = loginHref;
          }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E7C766] via-accent to-[#BC9A2E] text-[15px] font-bold text-[#241B02] shadow-gold transition-opacity disabled:opacity-60"
        >
          <CreditCard className="h-4 w-4" aria-hidden="true" />
          Pay now · ₹{service.price.toLocaleString('en-IN')} + GST
        </button>
      ) : (
        // A lawyer's account cannot hold a client's order, and pretending
        // otherwise would fail at the API with a message nobody expected.
        <p className="rounded-xl border border-ink/10 bg-muted/50 px-3.5 py-3 text-[13px] leading-relaxed text-ink/60">
          Services are bought from a client account. Log in as a client to order this one.
        </p>
      )}

      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/[0.09] text-[14px] font-semibold text-[#128C3E] transition-colors hover:border-[#25D366] hover:bg-[#25D366] hover:text-white"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Ask on WhatsApp
        </a>
      )}

      {mounted && open && (
        <CheckoutModal
          service={service}
          user={user}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/** One line of the price summary. */
function Row({ label, value, strong = false, tone = '' }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13.5px]">
      <span className={strong ? 'font-semibold text-ink' : 'text-ink/60'}>{label}</span>
      <span className={`${strong ? 'font-display text-[16px] font-bold text-ink' : 'font-medium text-ink/80'} ${tone}`}>
        {value}
      </span>
    </div>
  );
}

function CheckoutModal({ service, user, onClose }) {
  const [quote, setQuote] = useState(null);
  const [pricing, setPricing] = useState(true);
  const [error, setError] = useState('');
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [useWallet, setUseWallet] = useState(true);
  const [notes, setNotes] = useState('');
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(null);

  // Escape closes, and the page behind does not scroll — except once the order
  // is paid, when closing is the only thing left to do anyway.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !paying && onClose();
    document.addEventListener('keydown', onKey);
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      body.style.overflow = prev;
    };
  }, [onClose, paying]);

  const price = useCallback(
    async (code, wallet) => {
      setPricing(true);
      setError('');
      try {
        const res = await fetch('/api/marketplace/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: service.slug, couponCode: code, useWallet: wallet }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Could not price this order.');
          return;
        }
        setQuote(data);
        // A rejected code is reported beside the field, with the rest of the
        // summary intact — the same way the API returns it.
        setAppliedCoupon(data.couponError ? '' : data.coupon?.code || '');
      } catch {
        setError('Could not reach the server. Please try again.');
      } finally {
        setPricing(false);
      }
    },
    [service.slug]
  );

  useEffect(() => {
    price('', true);
  }, [price]);

  const amounts = quote?.amounts;
  const walletBalance = quote?.walletBalance || 0;

  const pay = async () => {
    setPaying(true);
    setError('');
    try {
      const res = await fetch('/api/marketplace/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: service.slug,
          couponCode: appliedCoupon,
          useWallet,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start the payment.');
        setPaying(false);
        return;
      }

      // The wallet covered the whole thing — there is nothing to collect, so
      // no checkout opens.
      if (data.paid) {
        refreshAuth();
        setDone(data.order);
        setPaying(false);
        return;
      }

      const ready = await loadRazorpayCheckout();
      if (!ready) {
        setError('Could not load the payment window. Check your connection.');
        setPaying(false);
        return;
      }

      const { checkout } = data;
      const rzp = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        order_id: checkout.orderId,
        name: 'Justiceland',
        description: service.title,
        prefill: checkout.prefill,
        theme: { color: '#1E3A5F' },
        handler: async (response) => {
          const confirm = await fetch('/api/marketplace/orders/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          const result = await confirm.json();
          if (!confirm.ok) {
            setError(
              result.error ||
                'Payment could not be confirmed. If money was deducted it will be returned or the order updated shortly.'
            );
            setPaying(false);
            return;
          }
          refreshAuth();
          setDone(result.order || data.order);
          setPaying(false);
        },
        modal: {
          // Closing the sheet is not a failure; the order stays pending and
          // releases itself after half an hour.
          ondismiss: () => setPaying(false),
        },
      });
      rzp.open();
    } catch (err) {
      console.error('service checkout', err);
      setError('Something went wrong starting the payment.');
      setPaying(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Order ${service.title}`}
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]" onClick={() => !paying && onClose()} aria-hidden="true" />

      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-ink/8 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink/45">
              {done ? 'Order placed' : 'Order summary'}
            </p>
            <h2 className="mt-0.5 truncate font-display text-[17px] font-bold text-ink">
              {service.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={paying}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/[0.05] text-ink/60 transition-colors hover:bg-ink/10 disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {done ? (
            <div className="py-4 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
                <Check className="h-7 w-7" strokeWidth={3} aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-[19px] font-bold text-ink">Payment received</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink/60">
                Your order <span className="font-semibold text-ink">{done.reference}</span> is
                confirmed. A lawyer will contact you for the documents.
              </p>
              <div className="mt-4 rounded-xl bg-[#F4F7FB] px-4 py-3 text-left">
                <Row label="Paid" value={`₹${(done.amounts?.payable || 0).toLocaleString('en-IN')}`} strong />
                {done.amounts?.walletUsed > 0 && (
                  <div className="mt-1.5">
                    <Row
                      label="From wallet"
                      value={`₹${done.amounts.walletUsed.toLocaleString('en-IN')}`}
                    />
                  </div>
                )}
              </div>
              <Link
                href="/account"
                className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary hover:underline"
              >
                Go to my account
              </Link>
            </div>
          ) : (
            <>
              {/* Coupon */}
              <label htmlFor="svc-coupon" className="text-[12px] font-bold uppercase tracking-wide text-ink/45">
                Coupon
              </label>
              <div className="mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" aria-hidden="true" />
                  <input
                    id="svc-coupon"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    placeholder="Have a code?"
                    className="h-11 w-full rounded-xl border border-ink/12 bg-surface pl-9 pr-3 text-sm uppercase text-ink outline-none transition-colors placeholder:normal-case placeholder:text-ink/40 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => price(coupon, useWallet)}
                  disabled={pricing || !coupon.trim()}
                  className="h-11 shrink-0 rounded-xl border border-primary/30 bg-primary/[0.07] px-4 text-[13.5px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-white disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
              {quote?.couponError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-rose-600">
                  <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {quote.couponError}
                </p>
              )}
              {appliedCoupon && !quote?.couponError && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-600">
                  <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden="true" />
                  {appliedCoupon} applied
                </p>
              )}

              {/* Wallet */}
              {walletBalance > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const next = !useWallet;
                    setUseWallet(next);
                    price(appliedCoupon, next);
                  }}
                  className={`mt-4 flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                    useWallet ? 'border-primary/30 bg-primary/[0.05]' : 'border-ink/12 bg-surface'
                  }`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/[0.08] text-primary">
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-ink">Use wallet balance</span>
                    <span className="block text-[12px] text-ink/55">
                      ₹{walletBalance.toLocaleString('en-IN')} available
                    </span>
                  </span>
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                      useWallet ? 'border-primary bg-primary text-white' : 'border-ink/25'
                    }`}
                  >
                    {useWallet && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
                  </span>
                </button>
              )}

              {/* Anything the client wants the lawyer to know before starting. */}
              <label htmlFor="svc-notes" className="mt-4 block text-[12px] font-bold uppercase tracking-wide text-ink/45">
                Notes <span className="font-medium normal-case text-ink/35">(optional)</span>
              </label>
              <textarea
                id="svc-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Anything the lawyer should know before starting"
                className="mt-1.5 w-full rounded-xl border border-ink/12 bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-primary focus:ring-2 focus:ring-primary/15"
              />

              {/* Totals */}
              <div className="mt-4 space-y-2 rounded-xl bg-[#F4F7FB] px-4 py-3.5">
                {pricing && !amounts ? (
                  <p className="flex items-center justify-center gap-2 py-2 text-[13px] text-ink/55">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Working out the total…
                  </p>
                ) : (
                  amounts && (
                    <>
                      <Row label="Service" value={`₹${amounts.base.toLocaleString('en-IN')}`} />
                      {amounts.discount > 0 && (
                        <Row
                          label="Coupon discount"
                          value={`− ₹${amounts.discount.toLocaleString('en-IN')}`}
                          tone="!text-emerald-600"
                        />
                      )}
                      <Row
                        label={`GST ${Math.round((amounts.gstRate || 0.18) * 100)}%`}
                        value={`₹${amounts.gst.toLocaleString('en-IN')}`}
                      />
                      {amounts.walletUsed > 0 && (
                        <Row
                          label="Paid from wallet"
                          value={`− ₹${amounts.walletUsed.toLocaleString('en-IN')}`}
                          tone="!text-emerald-600"
                        />
                      )}
                      <div className="border-t border-ink/10 pt-2">
                        <Row
                          label={amounts.walletUsed > 0 ? 'Pay online' : 'Total payable'}
                          value={`₹${amounts.razorpayAmount.toLocaleString('en-IN')}`}
                          strong
                        />
                      </div>
                    </>
                  )
                )}
              </div>

              {error && (
                <p className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {!done && (
          <div className="shrink-0 border-t border-ink/8 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3.5">
            <button
              type="button"
              onClick={pay}
              disabled={paying || pricing || !amounts}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E7C766] via-accent to-[#BC9A2E] text-[15px] font-bold text-[#241B02] shadow-gold disabled:opacity-60"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Opening payment…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  {amounts && amounts.razorpayAmount === 0
                    ? 'Pay from wallet'
                    : `Pay ₹${(amounts?.razorpayAmount ?? 0).toLocaleString('en-IN')}`}
                </>
              )}
            </button>
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11.5px] text-ink/50">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
              Secure payment by Razorpay · {user?.name ? `Billed to ${user.name}` : 'UPI, card, netbanking'}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
