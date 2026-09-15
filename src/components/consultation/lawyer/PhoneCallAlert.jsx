'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { PhoneCall, PhoneIncoming, X } from 'lucide-react';

function clock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * PhoneCallAlert — audio consultations happen on the lawyer's own phone, not in
 * the browser, so there is nothing here to answer. This tells them it is
 * ringing (and who is on the line) so they reach for the handset, and turns
 * into a running "on call" card once it connects.
 *
 * @param {object} props
 * @param {object} props.session  a pending or active audio session
 * @param {()=>void} props.onDismiss
 * @param {boolean} [props.raised]  sit above the minimized-chat dock
 */
export default function PhoneCallAlert({ session, onDismiss, raised = false }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pathname = usePathname() || '';
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!mounted) return null;

  const ringing = session.status === 'pending';
  const since = new Date((ringing ? session.createdAt : session.startedAt) || now).getTime();
  // Above the portal's phone tab bar, and above the minimized-chat dock when
  // one shares this corner.
  const portal = pathname.startsWith('/dashboard');
  const lift = raised
    ? portal ? 'bottom-[10.5rem] md:bottom-28' : 'bottom-24 sm:bottom-28'
    : portal ? 'bottom-[5.25rem] md:bottom-6' : 'bottom-4 sm:bottom-6';

  return createPortal(
    <div
      role="status"
      className={`fixed left-3 right-3 z-[65] mx-auto flex max-w-sm items-center gap-3 rounded-2xl p-3 text-white shadow-2xl ring-1 ring-white/10 sm:left-auto sm:right-6 ${lift} ${
        ringing ? 'bg-emerald-700' : 'bg-primary-dark'
      }`}
    >
      <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15">
        {ringing && <span className="absolute inset-0 animate-ping rounded-full bg-white/25" />}
        {ringing ? <PhoneIncoming className="h-5 w-5" /> : <PhoneCall className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
          {ringing ? 'Your phone is ringing' : 'On phone call'}
        </p>
        <p className="truncate text-sm font-semibold">{session.userName || 'Client'}</p>
        <p className="text-xs tabular-nums text-white/65">
          {ringing ? `Pick up your registered number · ${clock(now - since)}` : `Audio consultation · ${clock(now - since)}`}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Hide"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>,
    document.body
  );
}
