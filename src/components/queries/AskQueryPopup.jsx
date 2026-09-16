'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { X, PenLine, UserCheck, PhoneCall, MessageSquareText } from 'lucide-react';
import AskQueryForm from './AskQueryForm';
import { ASK_QUERY_EVENT } from '@/utils/askQuery';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/components/location/LocationProvider';

const STORE_KEY = 'jl:ask-popup';
/** How long someone browses before the popup offers itself, once. */
const AUTO_OPEN_AFTER_MS = 25_000;
const DAY = 24 * 60 * 60 * 1000;
/** Closed it without asking: leave them alone for this long. */
const QUIET_AFTER_DISMISS = 3 * DAY;
/** Already asked: they are waiting for a call, not for another prompt. */
const QUIET_AFTER_SEND = 7 * DAY;

/**
 * Where neither the button nor the automatic popup belongs.
 *
 *   /ask                 the form is already the page.
 *   /admin, /dashboard,  working tools, and a lawyer is not the one with the
 *   /setup               legal problem.
 *   /login, /register,   halfway through something else; a dialog over a
 *   /user, /account      one-time code is how people lose it.
 *   /lawyers/[slug]      the visitor has found their lawyer — the profile's own
 *                        call and chat buttons are the better next step.
 */
function isExcluded(pathname) {
  return (
    /^\/(ask|admin|dashboard|setup|login|register|user|account|profile-preview)(\/|$)/.test(pathname) ||
    /^\/lawyers\/[^/]+/.test(pathname)
  );
}

/**
 * Whether some other modal is actually in front of the visitor. Presence in the
 * DOM is not enough: the mobile menu drawer stays mounted, parked off-screen,
 * and counting it would keep the popup waiting forever on a phone.
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

function readStore() {
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function writeStore(patch) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify({ ...readStore(), ...patch }));
  } catch {
    /* private mode — the popup just may offer itself again next visit */
  }
}

/**
 * The "have a legal problem?" popup, mounted once for the whole public site.
 *
 * Opened three ways:
 *   - the floating "Ask a lawyer" button beside WhatsApp and Call;
 *   - `openAskQuery()` from anywhere (practice-area bands, empty listings);
 *   - by itself, once, after a visitor has been browsing for a while — but not
 *     for a lawyer, not while another dialog is up, and not again for days
 *     after they close it or send a question.
 *
 * On a phone it is a bottom sheet, on a larger screen a centred dialog.
 */
export default function AskQueryPopup() {
  const pathname = usePathname() || '';
  const { role, user } = useAuth();
  const { location, cities, pickerOpen } = useLocation();

  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState({});
  // Remounts the form on every opening so the page's topic and city apply.
  const [openCount, setOpenCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const sentRef = useRef(false);
  const autoTriedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const show = useCallback((d = {}) => {
    sentRef.current = false;
    setDetail(d);
    setOpenCount((n) => n + 1);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    if (!sentRef.current) writeStore({ dismissedAt: Date.now() });
  }, []);

  // Anyone on the site can ask for it.
  useEffect(() => {
    const onAsk = (e) => show(e.detail || {});
    window.addEventListener(ASK_QUERY_EVENT, onAsk);
    return () => window.removeEventListener(ASK_QUERY_EVENT, onAsk);
  }, [show]);

  // The one automatic opening. The timer runs across navigations, because the
  // layout — and this component — stay mounted while the visitor browses.
  const blocked = role === 'advocate' || isExcluded(pathname) || pickerOpen;
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;

  useEffect(() => {
    if (autoTriedRef.current) return undefined;
    const { dismissedAt = 0, sentAt = 0 } = readStore();
    const now = Date.now();
    if (now - dismissedAt < QUIET_AFTER_DISMISS || now - sentAt < QUIET_AFTER_SEND) {
      autoTriedRef.current = true;
      return undefined;
    }
    let timer;
    const attempt = () => {
      // Another dialog open, or on a page that should not be interrupted: try
      // again shortly rather than giving up on the whole visit.
      if (blockedRef.current || anotherDialogOnScreen()) {
        timer = setTimeout(attempt, 5000);
        return;
      }
      autoTriedRef.current = true;
      show({ source: 'auto' });
    };
    timer = setTimeout(attempt, AUTO_OPEN_AFTER_MS);
    return () => clearTimeout(timer);
  }, [show]);

  // Escape closes; the page behind must not scroll under the sheet.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      body.style.overflow = prev;
    };
  }, [open, close]);

  // A lawyer leaving the portal is not the audience, and neither is someone on
  // a page listed above.
  const showButton = mounted && !open && role !== 'advocate' && !isExcluded(pathname);

  const defaults = {
    category: detail.category || '',
    city: detail.city || location?.city || '',
    name: role === 'user' ? user?.name || '' : '',
    phone: role === 'user' ? String(user?.phone || '').replace(/\D/g, '').slice(-10) : '',
  };

  return (
    <>
      {showButton && (
        <button
          type="button"
          onClick={() => show({ source: 'button' })}
          className="fixed bottom-[9.25rem] right-5 z-40 inline-flex items-center gap-2 rounded-full bg-accent py-2.5 pl-3 pr-4 text-sm font-bold text-[#241B02] shadow-gold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 sm:right-6"
        >
          <MessageSquareText className="h-5 w-5" aria-hidden="true" />
          <span>
            Ask a lawyer<span className="hidden sm:inline"> — free</span>
          </span>
        </button>
      )}

      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={close} aria-hidden="true" />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ask-popup-title"
            className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-card-hover animate-fade-up sm:max-w-xl sm:rounded-3xl"
          >
            <div className="relative bg-gradient-to-br from-primary to-primary-dark px-5 pb-5 pt-5 text-white sm:px-7">
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 id="ask-popup-title" className="pr-10 font-display text-xl font-semibold sm:text-2xl">
                Have a legal problem?
              </h2>
              <p className="mt-1 text-sm text-white/75">
                Tell us what happened. A verified lawyer will call you — free, no login.
              </p>
              <ol className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-medium leading-tight text-white/85 sm:text-xs">
                {[
                  { icon: PenLine, label: 'You write the problem' },
                  { icon: UserCheck, label: 'A lawyer takes it' },
                  { icon: PhoneCall, label: 'You get a call' },
                ].map(({ icon: Icon, label }) => (
                  <li key={label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 px-2 py-2.5">
                    <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ol>
            </div>

            <div className="overflow-y-auto px-5 pb-6 pt-5 sm:px-7">
              <AskQueryForm
                key={openCount}
                compact
                cities={cities.map((c) => c.name)}
                defaults={defaults}
                onDone={close}
                onSent={() => {
                  sentRef.current = true;
                  writeStore({ sentAt: Date.now() });
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
