'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Scale, LogOut, ExternalLink, X } from 'lucide-react';
import { DASHBOARD_NAV, PROFILE_SECTIONS } from '@/constants/dashboard';
import { useInbox } from '@/components/dashboard/overview/LiveInbox';
import { useAvailability } from '@/hooks/useAvailability';
import { logout } from '@/utils/logout';
import { cn } from '@/utils/cn';
import PortalAvatar from './PortalAvatar';
import AvailabilityToggle from '@/components/dashboard/AvailabilityToggle';

/**
 * Everything the portal's navigation holds — brand, grouped sections with the
 * live request count, and the lawyer with their online state. Rendered as the
 * fixed rail on desktop and inside the slide-in drawer on phones and tablets,
 * so both always offer exactly the same places to go.
 *
 * @param {object} props
 * @param {{name:string, photo:string, available:boolean, profileHref:string}} props.lawyer
 * @param {()=>void} [props.onClose]  shows a close button (drawer only)
 */
function PortalNavPanel({ lawyer, onClose }) {
  const pathname = usePathname() || '';
  const { sessions } = useInbox();
  const { available } = useAvailability(lawyer.available);
  const pending = sessions.filter((s) => s.status === 'pending').length;
  const editing = pathname.startsWith('/dashboard/profile');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-accent shadow-brand">
            <Scale className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold text-ink">Justiceland</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
              Lawyer Portal
            </span>
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-10 w-10 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav aria-label="Lawyer portal" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4 pt-1">
        {DASHBOARD_NAV.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink/35">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const [base, hash] = item.href.split('#');
                const active = !hash && pathname === base;
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary text-white shadow-brand'
                          : 'text-ink/65 hover:bg-primary/[0.06] hover:text-primary'
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors',
                          active ? 'bg-white/15 text-accent' : 'bg-muted text-ink/50 group-hover:bg-primary/10 group-hover:text-primary'
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge === 'pending' && pending > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                          {pending}
                        </span>
                      )}
                    </Link>

                    {/* The profile's sections, only while the profile is open. */}
                    {item.href === '/dashboard/profile' && editing && (
                      <ul className="my-1.5 ml-7 space-y-0.5 border-l-2 border-primary/10 pl-3">
                        {PROFILE_SECTIONS.map((s) => (
                          <li key={s.href}>
                            <Link
                              href={s.href}
                              onClick={onClose}
                              className="block rounded-lg px-2.5 py-1.5 text-[13px] text-ink/55 transition-colors hover:bg-primary/[0.06] hover:text-primary"
                            >
                              {s.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-ink/8 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/70 p-3">
          <span className="relative">
            <PortalAvatar src={lawyer.photo} name={lawyer.name} size={40} />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                available ? 'bg-emerald-500' : 'bg-ink/30'
              }`}
            />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-ink">{lawyer.name}</p>
            <p className={`text-xs font-medium ${available ? 'text-emerald-600' : 'text-ink/45'}`}>
              {available ? 'Taking requests' : 'Not taking requests'}
            </p>
          </div>
        </div>
        {/* The switch itself, reachable from every page — on phones the drawer
            is the only chrome with room for it. */}
        <div className="mt-2 flex justify-center">
          <AvailabilityToggle initialAvailable={lawyer.available} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <a
            href={lawyer.profileHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-ink/10 py-2 text-xs font-semibold text-ink/65 transition-colors hover:border-primary/30 hover:text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Profile
          </a>
          <button
            type="button"
            onClick={() => logout('/login')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * PortalSidebar — the portal's fixed rail on desktop (lg and up). Light, like a
 * messaging or calendar app rather than an admin console.
 */
export default function PortalSidebar({ lawyer }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[17rem] shrink-0 border-r border-ink/8 bg-surface lg:block">
      <PortalNavPanel lawyer={lawyer} />
    </aside>
  );
}

/**
 * PortalDrawer — the same navigation, sliding in from the left on phones and
 * tablets. Closes on navigation, on Escape and on a tap outside.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {()=>void} props.onClose
 * @param {object} props.lawyer
 */
export function PortalDrawer({ open, onClose, lawyer }) {
  const pathname = usePathname();

  // A link was followed — the drawer has done its job.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    // Keep the page behind still while the menu is over it.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={`absolute inset-y-0 left-0 w-[min(19rem,86vw)] bg-surface shadow-2xl transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <PortalNavPanel lawyer={lawyer} onClose={onClose} />
      </div>
    </div>
  );
}
