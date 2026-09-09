import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import PageHeader from '@/components/shared/PageHeader';
import { Container } from '@/components/ui';
import { MEMBERSHIP_PLANS, annualTotal, GST_RATE } from '@/constants/membershipPlans';

export const metadata = createMetadata({
  title: 'Plans for Lawyers',
  description:
    'Listing plans for lawyers on Justiceland. List more practice areas, more matters and more cities, and rank above free listings in search. From ₹199 a month, billed yearly.',
  path: '/pricing',
  keywords: [
    'lawyer listing plans india',
    'advocate profile plan',
    'justiceland pricing',
  ],
});

/**
 * The plans, for somebody who does not have an account yet.
 *
 * Deliberately read-only. Buying needs a lawyer to be signed in — a membership
 * attaches to an account, and there is no account to attach one to until they
 * have registered — so every button here leads to registration or to the
 * dashboard, and none of them opens a checkout that could not complete.
 *
 * The prices and limits come from the same table the server enforces, so this
 * page cannot advertise an allowance that a save would then refuse.
 */
export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="For Lawyers"
        title="Plans for Lawyers"
        subtitle="Consultations work the same on every plan. What a plan changes is how much of your practice you can list, and where you sit in a search."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Plans' }]}
      />

      <Container className="py-10 sm:py-14">
        <div className="grid gap-5 lg:grid-cols-3">
          {MEMBERSHIP_PLANS.map((plan) => {
            const price = annualTotal(plan.id);
            const isTop = plan.id === 'premium';

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-surface p-6 ${
                  isTop ? 'border-[#D4AF37]/50 shadow-card' : 'border-ink/10'
                }`}
              >
                {isTop && (
                  <span className="absolute -top-2.5 right-5 rounded-full bg-[#D4AF37] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[#0F172A]">
                    Best placement
                  </span>
                )}

                <h2 className="font-display text-xl font-bold text-ink">{plan.name}</h2>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/55">
                  {plan.tagline}
                </p>

                <div className="mt-5">
                  {plan.monthly === 0 ? (
                    <p className="font-display text-3xl font-bold text-ink">Free</p>
                  ) : (
                    <>
                      <p className="font-display text-3xl font-bold text-ink">
                        ₹{plan.monthly}
                        <span className="text-sm font-medium text-ink/50">/month</span>
                      </p>
                      <p className="mt-1 text-[12.5px] text-ink/45">
                        Billed yearly — ₹{price.base.toLocaleString('en-IN')} + ₹
                        {price.gst.toLocaleString('en-IN')} GST ={' '}
                        <span className="font-semibold text-ink/70">
                          ₹{price.total.toLocaleString('en-IN')}
                        </span>
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-5 space-y-1.5 border-t border-ink/8 pt-5 text-sm">
                  <p className="font-semibold text-ink">
                    {plan.areas === null ? 'Unlimited' : plan.areas} practice areas
                  </p>
                  <p className="font-semibold text-ink">
                    {plan.matters === null ? 'Unlimited' : plan.matters} matters
                  </p>
                  <p className="font-semibold text-ink">
                    {plan.cities === null ? 'Unlimited' : plan.cities} practice cities
                  </p>
                  <p className="text-ink/55">{plan.placement}</p>
                </div>

                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-[13.5px] text-ink/70">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.monthly === 0 ? '/register' : '/dashboard/plan'}
                  className={`mt-6 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
                    isTop
                      ? 'bg-[#D4AF37] text-[#0F172A] hover:bg-[#E7C766]'
                      : 'bg-primary text-white hover:bg-primary-dark'
                  }`}
                >
                  {plan.monthly === 0 ? 'Register free' : `Choose ${plan.name}`}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[13px] leading-relaxed text-ink/50">
          Prices include {Math.round(GST_RATE * 100)}% GST as shown, and a plan
          runs for twelve months. A paid plan is bought from your dashboard once
          you have registered — registration itself is free.{' '}
          <Link href="/register" className="font-semibold text-primary underline">
            Register your practice
          </Link>
          .
        </p>
      </Container>
    </>
  );
}
