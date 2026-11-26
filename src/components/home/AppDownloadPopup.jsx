'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Check, Smartphone, X } from 'lucide-react';
import { StoreBadge } from '@/components/shared/AppDownload';
import { SITE } from '@/constants/site';
import { SIGNUP_BONUS } from '@/constants/callRates';

/** How long a visitor reads the home page before the offer appears. */
const SHOW_AFTER_MS = 10_000;
/** After "Maybe later", leave them alone this long. */
const QUIET_FOR_MS = 3 * 24 * 60 * 60 * 1000;
const STORE_KEY = 'jl-app-popup-dismissed-at';

const POINTS = [`₹${SIGNUP_BONUS} free in your wallet on sign-up`, 'Call, chat or video in a tap', 'Pay only for the minutes you use', 'Anonymous mode keeps your name private'];

function dismissedRecently() {
  try {
    return Date.now() - Number(window.localStorage.getItem(STORE_KEY) || 0) < QUIET_FOR_MS;
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    window.localStorage.setItem(STORE_KEY, String(Date.now()));
  } catch {
    /* private mode — it simply may show again next visit */
  }
}

/**
 * Another modal actually in front of the visitor (the same test AskQueryPopup
 * uses). Being in the DOM is not enough: the mobile menu drawer stays mounted,
 * parked off-screen to the side, and counting it would wait forever on a phone.
 */
function anotherDialogOnScreen() {
  return [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some((el) => {
    const r = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      r.width > 0 && r.height > 0 &&
      r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight &&
      style.visibility !== 'hidden' && style.opacity !== '0'
    );
  });
}

/**
 * AppDownloadPopup — the app, offered once on the home page.
 *
 * Opens after the visitor has had ten seconds with the page, never on top of
 * another dialog, and after "Maybe later" stays away for three days. On a
 * phone it is a sheet from the bottom; on a larger screen a card that rises
 * into the middle. The badges go straight to each store.
 */
export default function AppDownloadPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (dismissedRecently()) return undefined;
    let timer;
    const attempt = () => {
      if (anotherDialogOnScreen()) {
        timer = setTimeout(attempt, 4000);
        return;
      }
      setOpen(true);
    };
    timer = setTimeout(attempt, SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  const close = useCallback(() => {
    rememberDismissed();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Get the ${SITE.name} app`}
    >
      <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-[3px]" onClick={close} aria-hidden="true" />

      <div className="relative w-full max-w-[440px] animate-sheet-up overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:animate-pop-in sm:rounded-[28px]">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-ink/60 shadow-sm ring-1 ring-ink/10 backdrop-blur transition hover:bg-white hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── The phones ──────────────────────────────────────────────── */}
        <div className="relative h-[230px] overflow-hidden bg-gradient-to-b from-[#E8EFF8] via-[#F1F5FB] to-white">
          <span
            className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,rgba(30,58,95,0.12)_1px,transparent_0)] [background-size:16px_16px]"
            aria-hidden="true"
          />
          <span className="absolute left-1/2 top-16 h-40 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />

          <div className="absolute left-1/2 top-9 w-[118px] -translate-x-[115%] rotate-[-8deg]">
            <div className="animate-float-slow overflow-hidden rounded-[20px] border-[4px] border-slate-900 bg-slate-900 shadow-xl">
              <Image src="/app-screens/screen-3.webp" alt="" width={600} height={1067} sizes="120px" className="block h-auto w-full rounded-[16px]" />
            </div>
          </div>
          <div className="absolute left-1/2 top-9 w-[118px] translate-x-[15%] rotate-[8deg]">
            <div className="animate-float-slow overflow-hidden rounded-[20px] border-[4px] border-slate-900 bg-slate-900 shadow-xl">
              <Image src="/app-screens/screen-5.webp" alt="" width={600} height={1067} sizes="120px" className="block h-auto w-full rounded-[16px]" />
            </div>
          </div>
          <div className="absolute left-1/2 top-5 z-10 w-[138px] -translate-x-1/2">
            <div className="animate-float overflow-hidden rounded-[22px] border-[5px] border-slate-900 bg-slate-900 shadow-[0_24px_48px_-16px_rgba(15,23,42,0.6)]">
              <Image src="/app-screens/screen-4.webp" alt={`${SITE.name} app`} width={600} height={1067} sizes="140px" priority className="block h-auto w-full rounded-[17px]" />
            </div>
          </div>
          <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" aria-hidden="true" />
        </div>

        {/* ── The offer ───────────────────────────────────────────────── */}
        <div className="px-6 pb-6 pt-2 text-center sm:px-8 sm:pb-7">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.07] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
            <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
            Free on Android &amp; iPhone
          </p>
          <h2 className="mt-3 font-display text-[1.6rem] font-bold leading-tight text-ink">Legal help in your pocket</h2>
          <p className="mx-auto mt-1.5 max-w-xs text-[14px] leading-relaxed text-ink/60">
            Download the {SITE.name} app and talk to a verified lawyer wherever you are.
          </p>

          <ul className="mx-auto mt-4 w-fit space-y-1.5 text-left">
            {POINTS.map((p, i) => (
              <li
                key={p}
                className="flex animate-fade-up items-center gap-2 text-[13.5px] font-medium text-ink/75"
                style={{ animationDelay: `${0.25 + i * 0.1}s` }}
              >
                <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-primary text-white">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap justify-center gap-2.5" onClick={() => rememberDismissed()}>
            <StoreBadge store="android" />
            <StoreBadge store="ios" />
          </div>

          <button
            type="button"
            onClick={close}
            className="mt-4 text-[13px] font-semibold text-ink/45 transition-colors hover:text-ink"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
