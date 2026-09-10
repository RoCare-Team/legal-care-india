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
}) {
  return (
    <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 overflow-x-hidden bg-surface lg:grid-cols-[300px_minmax(0,1fr)_400px]">
        {/* ── Brand ─────────────────────────────────────────────────────── */}
        <aside className="hidden flex-col justify-center bg-gradient-to-b from-primary via-primary-dark to-secondary p-10 text-white lg:flex xl:p-12">
          {/* No logo. It sits in the header bar directly above this panel, and
              repeated here on the white plate its lack of transparency forces,
              it read as a second brand mark pasted onto the navy rather than as
              the same one. The words carry the brand here. */}
          <p className="whitespace-pre-line font-display text-[22px] font-bold leading-snug">
            {headline}
          </p>

          <ul className="mt-7 space-y-4">
            {benefits.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-accent ring-1 ring-inset ring-accent/30">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="text-[13.5px] leading-snug text-white/85">{label}</span>
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
          <div className="w-full max-w-[400px] rounded-2xl border border-ink/8 bg-surface p-6 shadow-card sm:p-8">
            {children}
          </div>

          <p className="mt-5 max-w-[400px] text-center text-xs text-ink/45">
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
        {/* Fitted, not filled. Both panels are designed posters with words set
            into them, and `cover` crops whichever axis does not match the
            column — which on the lawyer panel took the U off "Use your
            expertise" and the J off "Join". A poster with its first letters
            missing is worse than one with a band of ground above it, so the
            whole artwork is shown and the column carries its own cream. */}
        <div className="relative hidden overflow-hidden bg-[#F3EFE7] lg:block">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="400px"
            className="object-contain object-center"
            priority
          />
        </div>
    </div>
  );
}
