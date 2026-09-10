import Image from 'next/image';
import Link from 'next/link';
import {
  BadgeCheck, ShieldCheck, MapPinned, MessagesSquare,
  Users, Clock, Wallet, TrendingUp,
} from 'lucide-react';
import { SITE } from '@/constants/site';

/**
 * AuthLayout — the three-panel shell every sign-in and sign-up screen sits in.
 *
 * Brand on the left, the form in the middle, a photograph on the right. The
 * form is the only part that changes between screens, which is the point of
 * having this: a visitor who starts as a client and later registers as a lawyer
 * should recognise the second screen as the same site, and four separate
 * hand-built pages had already drifted apart.
 *
 * Deliberately wide and short rather than a narrow column. A form of four
 * fields in a 480px column runs down the middle of an empty screen and looks
 * like an afterthought; the same four fields between a brand panel and a
 * photograph read as the front door of something.
 *
 * Both side panels are hidden below `lg`. On a phone the form is the whole
 * screen, which is correct — nobody scrolls past a photograph to reach the
 * field they came to fill in.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children  the form
 * @param {string} [props.headline]  the left panel's two-line promise
 * @param {Array<{icon: Function, label: string}>} [props.benefits]  left panel
 * @param {string} [props.image]     right panel photograph
 * @param {string} [props.imageAlt]
 * @param {'cover'|'contain'} [props.imageFit]  'contain' for artwork with
 *   words set into it, which a crop would cut the first letters off
 */

/** What a client gets. Four, because a fifth is a list nobody reads. */
export const CLIENT_BENEFITS = [
  { icon: BadgeCheck, label: 'Verified Lawyers' },
  { icon: ShieldCheck, label: 'Secure Consultations' },
  { icon: MapPinned, label: 'Pan India Access' },
  { icon: MessagesSquare, label: 'Multiple Consultation Options' },
];

/**
 * What a lawyer gets. A different audience answering a different question —
 * a client asks "can I trust this", a lawyer asks "is it worth my time" — so
 * the panel says something different rather than the same four claims.
 */
export const LAWYER_BENEFITS = [
  { icon: Users, label: 'Reach More Clients' },
  { icon: Clock, label: 'Flexible Working Hours' },
  { icon: Wallet, label: 'Secure Payments' },
  { icon: TrendingUp, label: 'Grow Your Practice' },
];

export default function AuthLayout({
  children,
  headline = `Your Legal Partner
Always.`,
  benefits = CLIENT_BENEFITS,
  image = '/user-login.png',
  imageAlt = '',
  imageFit = 'cover',
}) {
  return (
    <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 overflow-x-hidden bg-surface lg:grid-cols-[minmax(280px,1fr)_minmax(0,1.15fr)_minmax(300px,1fr)]">
        {/* ── Brand ─────────────────────────────────────────────────────── */}
        <aside className="hidden flex-col justify-center bg-gradient-to-b from-primary via-primary-dark to-secondary p-10 text-white lg:flex xl:p-12">
          {/* No logo. It sits in the header bar directly above this panel, and
              repeated here on the white plate its lack of transparency forces,
              it read as a second brand mark pasted onto the navy rather than as
              the same one. The words carry the brand here. */}
          <p className="whitespace-pre-line font-display text-[26px] font-bold leading-[1.25]">
            {headline}
          </p>

          {/* The gold rule the brand uses everywhere else — under the stats,
              under the section headings — so this panel belongs to the same
              site rather than being a navy rectangle with words on it. */}
          <span
            aria-hidden="true"
            className="mt-5 block h-[3px] w-14 rounded-full bg-gradient-to-r from-accent to-accent/30"
          />

          <ul className="mt-8 space-y-5">
            {benefits.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-accent ring-1 ring-inset ring-accent/30">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="text-[14px] leading-snug text-white/85">{label}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* ── Form ──────────────────────────────────────────────────────── */}
        {/* A tinted column so the form can be a white card that lifts off it.
            White on white it had no edges — the fields floated in the middle
            of the window with nothing holding them, which on the one screen a
            visitor has to trust with a phone number is the wrong impression. */}
        <div className="flex flex-col items-center justify-center bg-muted/50 px-5 py-10 sm:px-10 sm:py-14">
          <div className="w-full max-w-[440px] rounded-2xl border border-ink/8 bg-surface p-6 shadow-card sm:p-8">
            {children}
          </div>

          <p className="mt-5 max-w-[440px] text-center text-xs text-ink/45">
            By continuing you agree to {SITE.name}&apos;s{' '}
            <Link href="/terms" className="font-medium text-primary hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {/* ── Photograph ────────────────────────────────────────────────── */}
        {/* Filled by default, fitted only where the artwork carries words.

            `cover` reaches all four edges, which is what a photograph should
            do. `contain` shows the whole file and leaves bands of ground
            around it — right for the lawyer poster, whose quote loses its
            first letters to a crop, and wrong for a plain photograph, where
            the bands read as the image having failed to load. */}
        <div className="relative hidden overflow-hidden bg-[#F3EFE7] lg:block">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="400px"
            className={`object-center ${imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
            priority
          />
        </div>
    </div>
  );
}
