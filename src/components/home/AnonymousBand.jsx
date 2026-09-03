import Link from 'next/link';
import { ShieldCheck, Lock, Shield, Clock, ArrowRight } from 'lucide-react';
import Container from '@/components/ui/Container';

/**
 * The anonymity promise, stated once and in full.
 *
 * It sits between the lawyers and the cities on purpose. By this point the
 * visitor has seen real people they could call, and the question that stops
 * someone with a criminal or matrimonial matter is not who to call — it is
 * whether calling costs them their name. Answering it here, rather than in a
 * strip of chips under the hero, is the difference between a slogan and a
 * reason.
 *
 * The three claims along the bottom are the same three the hero used to carry.
 * They are claims about the product, so they say what is actually true: the
 * lawyer sees "Anonymous" instead of a name when the switch is on in the
 * account, the consultation runs over the platform rather than a phone
 * exchange, and a request reaches a lawyer who is online in minutes.
 */
const PROMISES = [
  { icon: Lock, label: '100% Anonymous' },
  { icon: Shield, label: 'Secure & Private' },
  { icon: Clock, label: '10 Min Connect' },
];

export default function AnonymousBand() {
  return (
    <section className="bg-muted/40 py-8 sm:py-10">
      <Container>
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#132C4B] via-[#0F172A] to-[#0F172A] shadow-card-hover">
          <div className="flex flex-col gap-6 px-6 py-8 sm:px-9 sm:py-9 lg:flex-row lg:items-center lg:gap-8">
            {/* The seal. A ring rather than a filled disc so the gold reads as
                a stamp on the navy rather than a button competing with the
                real one on the right. */}
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/40"
              aria-hidden="true"
            >
              <ShieldCheck className="h-8 w-8 text-[#D4AF37]" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[1.35rem] font-bold leading-tight text-white sm:text-[1.6rem]">
                100% Anonymous Consultation
              </h2>
              <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-slate-300 sm:text-[15px]">
                Your privacy is our priority. Talk to a verified lawyer without
                revealing your identity — turn on anonymous mode and they see
                “Anonymous” in place of your name.
              </p>
            </div>

            <Link
              href="/lawyers"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3.5 text-sm font-bold text-[#0F172A] shadow-lg transition-all hover:bg-[#E7C766] hover:shadow-xl"
            >
              Start Consultation
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* The three claims, on their own rule under the pitch. Divided
              rather than merely spaced: at this width three centred phrases
              with nothing between them read as one broken sentence. */}
          <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {PROMISES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center justify-center gap-2.5 px-4 py-3.5"
              >
                <Icon className="h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden="true" />
                <span className="text-[13px] font-semibold text-slate-200">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
