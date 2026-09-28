import { Check, Upload, ListChecks, MessageSquareText, FileCheck2 } from 'lucide-react';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import { getPlatformStats } from '@/lib/stats';
import ReviewStartCard from '@/components/documentReview/ReviewStartCard';
import ReviewPlans from '@/components/documentReview/ReviewPlans';
import ReportPreview from '@/components/documentReview/ReportPreview';
import { getSessionUserId } from '@/lib/auth';
import { getLatestAiReview } from '@/lib/documentReviews';
import {
  AI_REVIEW_FEE, LAWYER_RATE, EXPERT_REVIEW_HOURS, lawyerReviewPrice,
} from '@/constants/documentReview';

export const metadata = createMetadata({
  title: 'Legal Document Review Online — AI & Lawyer Review | Justiceland',
  description:
    `Upload any agreement, notice or deed. Get an instant AI risk report for ₹${AI_REVIEW_FEE}, or have a verified Indian lawyer review it from ₹${LAWYER_RATE} a page.`,
  path: '/document-review',
  keywords: ['legal document review online', 'rent agreement review', 'contract review lawyer india', 'ai document review'],
});

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const COMPARE = [
  ['Turnaround', '~2 minutes', `Within ${EXPERT_REVIEW_HOURS} hours`],
  ['Reviewed by', 'AI', 'Bar-verified advocate'],
  ['Risk rating & red flags', true, true],
  ['Missing-clause check', true, true],
  ['Written legal opinion', false, true],
  ['Advice on your specific situation', 'General guidance', 'Tailored to your facts'],
  ['Cost for a 12-page agreement', rupees(AI_REVIEW_FEE), rupees(lawyerReviewPrice(12))],
];

const STEPS = [
  { icon: Upload, title: 'Upload the document', body: 'PDF, or a clear photo of each page. Stored privately and encrypted.' },
  { icon: ListChecks, title: 'Choose AI or lawyer', body: 'Flat price for AI, per-page for a lawyer. You see the total before you pay.' },
  { icon: MessageSquareText, title: 'Tell us your worry', body: 'One line on what concerns you, so the review answers what you actually need.' },
  { icon: FileCheck2, title: 'Get your report', body: `AI in about 2 minutes, a lawyer within ${EXPERT_REVIEW_HOURS} hours — in your account.` },
];

function Cell({ value }) {
  if (value === true) return <Check className="mx-auto h-5 w-5 text-emerald-600" aria-label="Yes" />;
  if (value === false) return <span className="text-ink/35">Not included</span>;
  return <span>{value}</span>;
}

export default async function DocumentReviewPage() {
  const userId = await getSessionUserId();
  const [stats, latest] = await Promise.all([
    getPlatformStats(),
    userId ? getLatestAiReview(userId).catch(() => null) : null,
  ]);
  const lawyers = stats.find((s) => s.id === 'advocates')?.value || 0;

  return (
    <>
      {/* Hero: the promise on the left, the way in on the right. */}
      <section className="relative overflow-hidden bg-[#F6F8FB] pb-14 pt-6 sm:pt-8">
        {/* Both columns start at the top: centred, the shorter copy column sat
            a long way below the header beside the tall upload card. */}
        <Container className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="lg:pt-4">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#9A7B1C]">Document review</p>
            <h1 className="mt-3 font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight text-primary-dark sm:text-[2.8rem]">
              Don&apos;t sign it until{' '}
              <span className="bg-gradient-to-r from-[#B8912A] via-[#D4AF37] to-[#A67C1F] bg-clip-text text-transparent">
                someone reads it properly.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink/65 sm:text-base">
              Upload any agreement, notice or deed. Get an instant AI risk report for a flat{' '}
              <b className="text-ink">{rupees(AI_REVIEW_FEE)}</b> — or have a verified Indian lawyer read it line by line
              from <b className="text-ink">{rupees(LAWYER_RATE)} a page</b>.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] text-ink/65">
              {['AI report in ~2 minutes', `Lawyer review in ${EXPERT_REVIEW_HOURS} hours`, 'Private & encrypted'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="hidden lg:block">
              <ReportPreview review={latest} />
            </div>
          </div>
          <ReviewStartCard />
          {/* On a phone the upload card comes first; the report follows it. */}
          <div className="-mt-12 lg:hidden">
            <ReportPreview review={latest} />
          </div>
        </Container>
      </section>

      {/* What stands behind it. */}
      <section className="bg-primary-dark py-7 text-white">
        <Container className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {[
            [`${Number(lawyers).toLocaleString('en-IN')}+`, 'Verified lawyers on panel'],
            ['~2 min', 'AI report'],
            [`${EXPERT_REVIEW_HOURS} hrs`, 'Lawyer report'],
            ['100%', 'Private & encrypted'],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="font-display text-2xl font-bold sm:text-3xl">{n}</p>
              <p className="mt-0.5 text-[12.5px] text-white/60">{l}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* The two reviews. */}
      <section className="py-16">
        <Container>
          <p className="text-center text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#9A7B1C]">Two ways to review</p>
          <h2 className="mt-2 text-center font-display text-3xl font-bold text-ink sm:text-4xl">Pick the depth you actually need</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[15px] text-ink/60">
            Most people start with the AI report to see if anything is wrong. If it flags something serious — or a lot of
            money is involved — get a lawyer to read it.
          </p>
          <div className="mt-12">
            <ReviewPlans />
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[12.5px] text-ink/45">
            Page count is read from the document you upload, and you see the total before paying.
          </p>
        </Container>
      </section>

      {/* Side by side. */}
      <section className="bg-surface/60 py-16">
        <Container>
          <p className="text-center text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#9A7B1C]">Side by side</p>
          <h2 className="mt-2 text-center font-display text-3xl font-bold text-ink">Which one is right for your document?</h2>
          <div className="mx-auto mt-10 max-w-4xl overflow-x-auto rounded-2xl border border-ink/8 bg-white shadow-card">
            <table className="w-full min-w-[34rem] text-[13.5px]">
              <thead>
                <tr className="bg-primary-dark text-white">
                  <th className="px-5 py-3.5 text-left font-semibold">What you get</th>
                  <th className="px-5 py-3.5 text-center font-semibold">AI Review · {rupees(AI_REVIEW_FEE)}</th>
                  <th className="px-5 py-3.5 text-center font-semibold">Lawyer Review · from {rupees(LAWYER_RATE)}/page</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([label, ai, lawyer]) => (
                  <tr key={label} className="border-t border-ink/[0.06]">
                    <td className="px-5 py-3.5 font-medium text-ink">{label}</td>
                    <td className="px-5 py-3.5 text-center text-ink/65"><Cell value={ai} /></td>
                    <td className="px-5 py-3.5 text-center font-semibold text-emerald-700"><Cell value={lawyer} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* How it works. */}
      <section className="py-16">
        <Container>
          <p className="text-center text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#9A7B1C]">How it works</p>
          <h2 className="mt-2 text-center font-display text-3xl font-bold text-ink">Four steps, no office visit</h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="rounded-2xl border border-ink/8 bg-white p-6 shadow-card">
                <span className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/[0.08] text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-display text-3xl font-bold text-ink/10">{i + 1}</span>
                </span>
                <h3 className="mt-4 font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/60">{body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  );
}
