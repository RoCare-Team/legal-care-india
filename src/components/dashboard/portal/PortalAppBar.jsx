'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scale, Bell, ChevronDown, ExternalLink, BadgeIndianRupee, Settings, LogOut,
  MessagesSquare, PhoneCall, Video, Menu,
} from 'lucide-react';
import { PortalDrawer } from './PortalSidebar';
import { DASHBOARD_TITLES, PROFILE_SECTIONS } from '@/constants/dashboard';
import { useInbox } from '@/components/dashboard/overview/LiveInbox';
import AvailabilityToggle from '@/components/dashboard/AvailabilityToggle';
import { logout } from '@/utils/logout';
import { restoreConsultation } from '@/utils/consultationEvents';
import PortalAvatar from './PortalAvatar';

const TYPE = {
  chat: { label: 'Chat request', icon: MessagesSquare },
  audio: { label: 'Phone call', icon: PhoneCall },
  video: { label: 'Video call request', icon: Video },
};

/** Close a popover on outside click or Escape. */
function useDismiss(open, setOpen) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);
  return ref;
}

function Notifications() {
  const { sessions } = useInbox();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const pending = sessions.filter((s) => s.status === 'pending');
  const active = sessions.filter((s) => s.status === 'active');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Requests — ${pending.length} waiting`}
        className="relative grid h-10 w-10 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {pending.length > 0 && (
          <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {pending.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-card-hover">
          <div className="flex items-center justify-between border-b border-ink/8 px-4 py-3">
            <p className="font-semibold text-ink">Requests</p>
            {active.length > 0 && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {active.length} live now
              </span>
            )}
          </div>
          {pending.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink/50">No one is waiting right now.</p>
          ) : (
            <ul className="max-h-72 divide-y divide-ink/8 overflow-y-auto">
              {pending.map((s) => {
                const t = TYPE[s.type] || TYPE.chat;
                const Icon = t.icon;
                return (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <PortalAvatar name={s.userName} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{s.userName || 'Client'}</p>
                      <p className="flex items-center gap-1 text-xs text-ink/55">
                        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        {t.label}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/dashboard#requests"
            onClick={() => setOpen(false)}
            className="block border-t border-ink/8 px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-primary/[0.04]"
          >
            Open requests
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * A running consultation, always in sight from the top bar — tap to bring the
 * chat window back. Phone calls show too, but there is nothing to open.
 */
function LivePill() {
  const { sessions } = useInbox();
  const [now, setNow] = useState(() => Date.now());
  const live = sessions.find((s) => s.status === 'active');

  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live]);

  if (!live) return null;
  const sec = live.startedAt ? Math.max(0, Math.floor((now - new Date(live.startedAt).getTime()) / 1000)) : 0;
  const clock = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  const phone = live.type === 'audio';
  const Icon = TYPE[live.type]?.icon || MessagesSquare;

  return (
    <button
      type="button"
      onClick={phone ? undefined : restoreConsultation}
      title={phone ? 'On a phone call' : 'Open the live consultation'}
      className={`inline-flex h-9 items-center gap-2 rounded-full bg-emerald-600 pl-2 pr-3 text-xs font-semibold text-white shadow-sm ${
        phone ? 'cursor-default' : 'hover:bg-emerald-700'
      }`}
    >
      <span className="relative grid h-5 w-5 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="hidden max-w-[8rem] truncate sm:inline">{live.userName}</span>
      <span className="tabular-nums">{clock}</span>
    </button>
  );
}

function AccountMenu({ lawyer }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);

  const item = 'flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink/75 transition-colors hover:bg-ink/[0.04] hover:text-ink';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-ink/5 sm:pr-2"
      >
        <PortalAvatar src={lawyer.photo} name={lawyer.name} size={36} />
        <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-ink md:block">{lawyer.name}</span>
        <ChevronDown className="hidden h-4 w-4 text-ink/45 sm:block" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-ink/8 bg-surface py-1.5 shadow-card-hover">
          <div className="border-b border-ink/8 px-4 pb-2.5 pt-1.5">
            <p className="truncate text-sm font-semibold text-ink">{lawyer.name}</p>
            <p className="text-xs text-ink/50">Lawyer account</p>
          </div>
          <a href={lawyer.profileHref} target="_blank" rel="noopener noreferrer" className={item}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> {lawyer.published ? 'Public profile' : 'Preview profile'}
          </a>
          <Link href="/dashboard/plan" onClick={() => setOpen(false)} className={item}>
            <BadgeIndianRupee className="h-4 w-4" aria-hidden="true" /> Your plan
          </Link>
          <Link href="/dashboard/settings" onClick={() => setOpen(false)} className={item}>
            <Settings className="h-4 w-4" aria-hidden="true" /> Settings
          </Link>
          <button type="button" onClick={() => logout('/login')} className={`${item} text-red-600 hover:text-red-700`}>
            <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * PortalAppBar — the lawyer portal's sticky top bar: where they are, their
 * online switch, waiting requests, and their account.
 *
 * @param {object} props
 * @param {{name:string, photo:string, available:boolean, profileHref:string}} props.lawyer
 */
export default function PortalAppBar({ lawyer }) {
  const pathname = usePathname() || '/dashboard';
  const page = DASHBOARD_TITLES.find((t) => pathname.startsWith(t.prefix)) || DASHBOARD_TITLES.at(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
    {/* Outside the header: its backdrop blur would trap a fixed drawer inside it. */}
    <PortalDrawer open={menuOpen} onClose={closeMenu} lawyer={lawyer} />
    <header className="sticky top-0 z-30 border-b border-ink/8 bg-surface/90 backdrop-blur-md">

      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        {/* Phones and tablets: the full sidebar lives behind this. */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Phones and tablets: the brand, since the sidebar is tucked away. */}
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5 lg:hidden">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-dark text-accent">
            <Scale className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-bold text-ink">Justiceland</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-accent">
              Lawyer Portal
            </span>
          </span>
        </Link>

        <div className="hidden min-w-0 lg:block">
          <p className="truncate font-display text-xl font-semibold text-ink">{page.title}</p>
          <p className="truncate text-xs text-ink/50">{page.sub}</p>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <LivePill />
          {/* The overview's hero carries the big switch; one is enough there. */}
          {pathname !== '/dashboard' && (
            <div className="hidden sm:block">
              <AvailabilityToggle initialAvailable={lawyer.available} />
            </div>
          )}
          <Notifications />
          <AccountMenu lawyer={lawyer} />
        </div>
      </div>

      {/* Phones editing their profile: the section shortcuts the sidebar holds on desktop. */}
      {pathname.startsWith('/dashboard/profile') && (
        <nav aria-label="Profile sections" className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
          {PROFILE_SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="shrink-0 rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-xs font-medium text-ink/70 hover:border-primary/40 hover:text-primary"
            >
              {s.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
    </>
  );
}
