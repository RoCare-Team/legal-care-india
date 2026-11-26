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
        <div className="overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-card">
          <div className="flex flex-col gap-6 px-6 py-8 sm:px-9 sm:py-9 lg:flex-row lg:items-center lg:gap-8">
            {/* The seal: a soft navy tile, quieter than the button on the right. */}
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/[0.07] ring-1 ring-inset ring-primary/10"
              aria-hidden="true"
            >
              <ShieldCheck className="h-8 w-8 text-primary" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[1.35rem] font-bold leading-tight text-ink sm:text-[1.6rem]">
                100% Anonymous Consultation
              </h2>
              <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink/60 sm:text-[15px]">
                Your privacy is our priority. Talk to a verified lawyer without
                revealing your identity — turn on anonymous mode and they see
                “Anonymous” in place of your name.
              </p>
            </div>

            {/* Two ways in, because there are two visitors here: one knows
                they want a lawyer now, the other only knows what went wrong.
                The second used to have nowhere to go but the directory. */}
            <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href="/lawyers"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
              >
                Start Consultation
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/ask"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white px-6 py-3.5 text-sm font-bold text-ink transition-colors hover:border-primary hover:text-primary"
              >
                Ask a question — free
              </Link>
            </div>
          </div>

          {/* The three claims, on their own rule under the pitch. Divided
              rather than merely spaced: at this width three centred phrases
              with nothing between them read as one broken sentence. */}
          <div className="grid grid-cols-1 divide-y divide-ink/[0.07] border-t border-ink/[0.07] bg-slate-50/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {PROMISES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center justify-center gap-2.5 px-4 py-3.5"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-[13px] font-semibold text-ink/70">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
