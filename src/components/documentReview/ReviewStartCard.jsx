'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Upload, FileText, X, Sparkles, Scale, Lock, Loader2, CircleAlert, LogIn, Wallet } from 'lucide-react';
import { refreshAuth } from '@/utils/authEvents';
import { useAuth } from '@/hooks/useAuth';
import { loadRazorpayCheckout } from '@/utils/razorpayCheckout';
import {
  AI_REVIEW_FEE, AI_MAX_PAGES, LAWYER_RATE, EXPERT_REVIEW_HOURS, REVIEW_MAX_BYTES, REVIEW_ACCEPT,
  REVIEW_AREAS, lawyerReviewPrice,
} from '@/constants/documentReview';

/** Pages in a PDF, counted the same way the server prices it. */
async function countPages(file) {
  if (file.type !== 'application/pdf') return 1;
  const text = new TextDecoder('latin1').decode(await file.arrayBuffer());
  const m = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  return Math.max(1, m ? m.length : 1);
}

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

/**
 * ReviewStartCard — upload a document, pick AI or lawyer review, see the exact
 * price, pay. The price shown is the price charged: pages are counted here the
 * same way the server counts them, and the server prices from the file again.
 *
 * The plan cards further down the page pick a review type by dispatching a
 * `review:choose` event, which scrolls back up here with it selected.
 */
export default function ReviewStartCard() {
  const router = useRouter();
  const pathname = usePathname();
  const { role, user, loading: authLoading } = useAuth();
  const balance = Number(user?.walletBalance) || 0;
  const inputRef = useRef(null);
  const cardRef = useRef(null);

  const [kind, setKind] = useState('ai');
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState(0);
  const [area, setArea] = useState('property');
  const [question, setQuestion] = useState('');
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const choose = (e) => {
      setKind(e.detail === 'expert' ? 'expert' : 'ai');
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    window.addEventListener('review:choose', choose);
    return () => window.removeEventListener('review:choose', choose);
  }, []);

  const pick = async (f) => {
    setError('');
    if (!f) return;
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) {
      setError('Please upload a PDF, JPG or PNG file.');
      return;
    }
    if (f.size > REVIEW_MAX_BYTES) {
      setError('File is too large (max 5 MB).');
      return;
    }
    setFile(f);
    setPages(await countPages(f));
  };

  const price = kind === 'ai' ? AI_REVIEW_FEE : lawyerReviewPrice(pages || 1);
  const tooLongForAi = kind === 'ai' && pages > AI_MAX_PAGES;
  // Paid from the wallet when it covers the price; otherwise Razorpay opens.
  const fromWallet = role === 'user' && Boolean(file) && balance >= price;

  const start = async () => {
    setError('');
    if (role !== 'user') {
      router.push(`/user/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!file) {
      setError('Upload your document first.');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('kind', kind);
      fd.append('file', file);
      fd.append('area', area);
      fd.append('question', question);
      const res = await fetch('/api/document-review', { method: 'POST', body: fd });
      const order = await res.json();
      if (!res.ok) {
        setError(order.error || 'Could not start the review.');
        setBusy(false);
        return;
      }
      if (order.paid) {
        // Paid from the wallet — straight to the review.
        refreshAuth();
        router.push(`/document-review/${order.reviewId}?paid=1`);
        return;
      }
      if (!(await loadRazorpayCheckout())) {
        setError('Could not reach the payment page. Check your connection and try again.');
        setBusy(false);
        return;
      }
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Justiceland',
        description: kind === 'ai'
          ? 'AI document review'
          : `Lawyer review · ${order.pages} page${order.pages === 1 ? '' : 's'}`,
        image: '/logo1.png',
        prefill: order.prefill,
        theme: { color: '#1E3A5F' },
        handler: async (response) => {
          // The AI read runs inside verify; the result page shows progress.
          router.push(`/document-review/${order.reviewId}?paid=1`);
          fetch('/api/document-review/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
            keepalive: true,
          }).catch(() => {});
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.on('payment.failed', (resp) => {
        setBusy(false);
        setError(resp?.error?.description || 'Payment failed. Please try again.');
      });
      checkout.open();
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  const OPTIONS = [
    { value: 'ai', icon: Sparkles, title: 'AI Review', sub: `${rupees(AI_REVIEW_FEE)} flat · ~2 min` },
    { value: 'expert', icon: Scale, title: 'Lawyer Review', sub: `From ${rupees(LAWYER_RATE)}/page · ${EXPERT_REVIEW_HOURS} hrs` },
  ];

  return (
    <div
      ref={cardRef}
      id="start"
      className="w-full rounded-3xl border border-ink/8 bg-white p-5 shadow-[0_2px_4px_rgba(30,58,95,0.04),0_30px_60px_-30px_rgba(30,58,95,0.45)] sm:p-6"
    >
      <p className="font-display text-lg font-bold text-ink">Start your review</p>
      <p className="mt-0.5 text-[12.5px] text-ink/50">PDF, JPG or PNG · up to 5 MB</p>

      {/* Drop zone, or the chosen file. */}
      {file ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-rose-600 shadow-sm">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-ink">{file.name}</p>
            <p className="text-[12px] text-ink/50">
              {pages} page{pages === 1 ? '' : 's'} · {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setFile(null); setPages(0); }}
            aria-label="Remove file"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink/45 hover:bg-ink/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
          className={`mt-4 flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
            drag ? 'border-accent bg-accent/[0.06]' : 'border-ink/15 bg-muted/40 hover:border-primary/40'
          }`}
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-primary shadow-sm">
            <Upload className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="mt-2.5 text-[14px] font-semibold text-ink">Drag your document here, or browse</span>
          <span className="mt-0.5 text-[12px] text-ink/45">Agreement, notice, deed, contract…</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={REVIEW_ACCEPT}
        className="hidden"
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }}
      />

      {/* Which review. */}
      <div className="mt-4 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Review type">
        {OPTIONS.map(({ value, icon: Icon, title, sub }) => {
          const active = kind === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setKind(value)}
              className={`rounded-2xl border-2 p-3 text-left transition-colors ${
                active ? 'border-accent bg-accent/[0.07]' : 'border-ink/10 hover:border-ink/25'
              }`}
            >
              <span className="flex items-center gap-1.5 text-[13.5px] font-bold text-ink">
                <Icon className={`h-4 w-4 ${active ? 'text-[#9A7B1C]' : 'text-ink/45'}`} aria-hidden="true" />
                {title}
              </span>
              <span className="mt-0.5 block text-[11.5px] text-ink/50">{sub}</span>
            </button>
          );
        })}
      </div>

      {kind === 'expert' && (
        <label className="mt-3 block">
          <span className="text-[12px] font-semibold text-ink/55">Type of document</span>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-ink/12 bg-white px-3 text-[13px] text-ink outline-none focus:border-primary"
          >
            {REVIEW_AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </label>
      )}

      <label className="mt-3 block">
        <span className="text-[12px] font-semibold text-ink/55">
          Your worry <span className="font-normal text-ink/40">(optional)</span>
        </span>
        <textarea
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Is the lock-in clause fair? Can the landlord keep my deposit?"
          className="mt-1 w-full resize-none rounded-xl border border-ink/12 bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink/35 focus:border-primary"
        />
      </label>

      {kind === 'expert' && file && (
        <p className="mt-2 text-[12px] text-ink/55">
          {pages} page{pages === 1 ? '' : 's'} × {rupees(price / pages)} = <b className="text-ink">{rupees(price)}</b>
        </p>
      )}
      {tooLongForAi && (
        <p className="mt-2 text-[12px] text-amber-700">
          AI review takes up to {AI_MAX_PAGES} pages. Choose Lawyer Review for this document.
        </p>
      )}

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={start}
        disabled={busy || authLoading || tooLongForAi || role === 'advocate'}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B8912A] via-[#D4AF37] to-[#B8912A] text-[15px] font-bold text-primary-dark shadow-gold transition-opacity hover:opacity-95 disabled:opacity-50"
      >
        {busy ? (
          <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Starting…</>
        ) : role !== 'user' && !authLoading ? (
          <><LogIn className="h-4 w-4" aria-hidden="true" /> Sign in to continue</>
        ) : fromWallet ? (
          <><Wallet className="h-4 w-4" aria-hidden="true" /> Pay {rupees(price)} from wallet</>
        ) : (
          `Continue — ${kind === 'expert' && !file ? `from ${rupees(LAWYER_RATE)}` : rupees(price)}`
        )}
      </button>
      {role === 'user' && (
        <p className="mt-2 text-center text-[12px] text-ink/55">
          Wallet balance: <b className="text-ink">{rupees(balance)}</b>
          {file && !fromWallet && ` · not enough, so you will pay online`}
        </p>
      )}
      {role === 'advocate' && (
        <p className="mt-2 text-center text-[12px] text-ink/50">Reviews are booked from a client account.</p>
      )}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-ink/45">
        <Lock className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        Private & encrypted. Your document is never used to train AI.
      </p>
    </div>
  );
}
