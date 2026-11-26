import Link from 'next/link';
import { Gift, ArrowRight, PhoneCall, MessageSquareText, Video, Sparkles } from 'lucide-react';
import { Container } from '@/components/ui';
import { SIGNUP_BONUS } from '@/constants/callRates';

/** Where a client account is created (a mobile number and an OTP). */
export const SIGNUP_HREF = '/user/login';

/**
 * WelcomeBonus — the ₹199 every new client gets, as a coupon on the home page.
 *
 * The credit itself is real and automatic: it lands in the wallet the moment
 * the account is created (see /api/auth/user/otp/verify and SIGNUP_BONUS), and
 * pays for calls, chats and video like any other balance. This only says so.
 *
 * Drawn as a ticket — the amount on a stub, a perforated edge, the offer
 * beside it — so it reads as something to claim rather than one more banner.
 */
export default function WelcomeBonus() {
  return (
    <section className="py-8 sm:py-10">
      <Container>
        <div className="relative overflow-hidden rounded-[26px] border border-ink/8 bg-white shadow-card">
          <span className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#D4AF37]/15 blur-3xl" aria-hidden="true" />
          <span className="pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

          <div className="relative flex flex-col md:flex-row">
            {/* ── The stub ─────────────────────────────────────────────── */}
            <div className="relative flex shrink-0 flex-col items-center justify-center gap-1 px-8 pb-6 pt-8 md:w-[280px] md:py-10">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#E9C75A] to-[#B8912A] text-white shadow-[0_10px_20px_-8px_rgba(184,145,42,0.7)]">
                <Gift className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink/45">Welcome bonus</p>
              <p className="font-display text-[3.4rem] font-bold leading-none text-primary">
                ₹{SIGNUP_BONUS}
              </p>
              <p className="text-[13px] font-semibold text-ink/55">free in your wallet</p>
            </div>

            {/* The perforation: a dashed rule with a notch cut at each end. */}
            <div className="relative mx-6 border-t-2 border-dashed border-ink/12 md:mx-0 md:my-6 md:border-l-2 md:border-t-0" aria-hidden="true">
              <span className="absolute -left-9 -top-[9px] h-4 w-4 rounded-full bg-[#F4F6FA] ring-1 ring-ink/8 md:-left-[9px] md:-top-9" />
              <span className="absolute -right-9 -top-[9px] h-4 w-4 rounded-full bg-[#F4F6FA] ring-1 ring-ink/8 md:-bottom-9 md:-left-[9px] md:right-auto md:top-auto" />
            </div>

            {/* ── The offer ────────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col justify-center gap-5 px-6 pb-8 pt-6 md:flex-row md:items-center md:justify-between md:px-10 md:py-10">
              <div className="min-w-0 text-center md:text-left">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37]/15 px-3 py-1 text-[11.5px] font-bold uppercase tracking-wide text-[#8A6D1E]">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  New users only
                </p>
                <h2 className="mt-3 font-display text-[1.55rem] font-bold leading-tight text-ink sm:text-[1.9rem]">
                  Sign up and get ₹{SIGNUP_BONUS} to talk to a lawyer
                </h2>
                <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-ink/60">
                  Credited to your wallet the moment your account is created — use it for a call, chat or
                  video consultation with any verified lawyer.
                </p>
                <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12.5px] font-medium text-ink/50 md:justify-start">
                  <span className="inline-flex items-center gap-1.5"><PhoneCall className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Call</span>
                  <span className="inline-flex items-center gap-1.5"><MessageSquareText className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Chat</span>
                  <span className="inline-flex items-center gap-1.5"><Video className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Video</span>
                </p>
              </div>

              <Link
                href={SIGNUP_HREF}
                className="group inline-flex shrink-0 items-center justify-center gap-2 self-center rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_-12px_rgba(30,58,95,0.7)] transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
              >
                Sign up free &amp; claim ₹{SIGNUP_BONUS}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
