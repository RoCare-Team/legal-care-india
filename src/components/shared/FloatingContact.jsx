'use client';

import { usePathname } from 'next/navigation';
import { Phone, MessageCircle } from 'lucide-react';
import { CONTACT, SITE } from '@/constants/site';

/**
 * FloatingContact — the WhatsApp and Call buttons pinned to the corner of every
 * public page, for a visitor who wants to reach Legal Care India itself rather
 * than a particular lawyer.
 *
 * Deliberately not shown everywhere:
 *
 *   /admin, /dashboard   these are working tools for staff and for lawyers, not
 *                        the shopfront. A support-chat bubble over a data table
 *                        is only ever in the way.
 *   /lawyers/[slug]      on a phone the profile already pins its own Call /
 *                        WhatsApp / Video bar to the bottom of the screen. Two
 *                        sets of call buttons a centimetre apart, going to two
 *                        different numbers, is worse than one.
 *
 * The buttons sit above the scroll-to-top control, which moves to the opposite
 * corner (see ScrollToTop) — WhatsApp on the right is the convention people
 * reach for without looking.
 */
export default function FloatingContact() {
  const pathname = usePathname() || '';

  const hidden =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    // A single lawyer's profile — not the /lawyers listing, which has no bar.
    /^\/lawyers\/[^/]+/.test(pathname);

  if (hidden) return null;

  const waHref = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    `Hi ${SITE.name}, I need help finding a lawyer.`
  )}`;

  return (
    <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3 sm:right-6">
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        title="Chat on WhatsApp"
        className="group grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_6px_20px_-6px_rgba(37,211,102,0.7)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50 focus-visible:ring-offset-2"
      >
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      </a>

      <a
        href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
        aria-label={`Call ${SITE.name}`}
        title={`Call ${CONTACT.phone}`}
        className="grid h-12 w-12 place-items-center rounded-full bg-primary text-white shadow-[0_6px_20px_-6px_rgba(30,58,95,0.65)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
      >
        <Phone className="h-5 w-5" aria-hidden="true" />
      </a>
    </div>
  );
}
