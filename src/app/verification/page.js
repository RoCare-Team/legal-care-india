import { createMetadata } from '@/lib/metadata';
import { SITE } from '@/constants/site';
import ContentPage from '@/components/shared/ContentPage';
import { Button } from '@/components/ui';

export const metadata = createMetadata({
  title: 'How Lawyers Are Verified on Justiceland',
  description:
    'Every lawyer on Justiceland registers with a Bar Council enrolment number, and each profile is reviewed before it is published. Here is what that check covers.',
  path: '/verification',
  keywords: [
    'verified lawyers india',
    'bar council enrolment check',
    'how justiceland verifies lawyers',
    'trusted lawyer platform india',
  ],
});

export default function VerificationPage() {
  return (
    <ContentPage
      eyebrow="For Lawyers"
      title="Lawyer Verification"
      subtitle="How we help clients connect with genuine, trustworthy lawyers."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Verification' }]}
    >
      <p>
        Trust is at the heart of {SITE.name}. The verification badge tells clients that a lawyer&apos;s
        core details have been checked, so they can reach out with confidence.
      </p>

      <h2>What we check</h2>
      <ul>
        <li><strong>Identity:</strong> the lawyer&apos;s name and contact details.</li>
        <li><strong>Bar council registration:</strong> a valid bar council enrolment number.</li>
        <li><strong>Practice details:</strong> city, areas of practice and experience.</li>
      </ul>

      <h2>How to get verified</h2>
      <ul>
        <li>Register for a free lawyer account.</li>
        <li>Complete your profile, including your bar council number, from the dashboard.</li>
        <li>Our team reviews the details and adds the verified badge once confirmed.</li>
      </ul>

      <h2>What the badge does and does not mean</h2>
      <p>
        Being clear about this matters more than making the badge sound impressive. Verified means we
        have checked that the person is a real, enrolled advocate and that the practice details on the
        profile match what they told us. It is a check on identity and enrolment.
      </p>
      <p>
        It is not a rating, a recommendation, or an opinion on how good a lawyer is at a particular kind
        of case. We do not grade lawyers, and we do not accept payment to change a verification outcome.
        Judging whether a lawyer is right for your matter is still your decision — which is why every
        profile shows practice areas, courts, languages and consultation rates before you commit to
        anything.
      </p>

      <h2>Until a profile is verified</h2>
      <p>
        A newly registered lawyer&apos;s profile stays pending and is not published or listed in search
        until the review is complete. Nothing appears publicly on the strength of self-declared details
        alone. If something in an application cannot be confirmed, we come back to the lawyer for
        clarification rather than publishing and correcting later.
      </p>

      <h2>Keeping details current</h2>
      <p>
        Verification is a point-in-time check, so profiles are only as accurate as the lawyer keeps them.
        Practice areas, city, courts, languages and per-minute consultation rates can all be updated from
        the dashboard at any time, and we ask lawyers to keep them current. If you are a client and
        something on a profile looks wrong or out of date, tell us and we will look into it.
      </p>

      <h2>Reporting a profile</h2>
      <p>
        If you believe a listed profile is not genuine, is misrepresenting its credentials, or belongs to
        someone no longer entitled to practise, contact us with the profile link and what you have
        noticed. We investigate every report, and a profile can be unpublished while that happens.
      </p>

      <div className="not-prose mt-8 flex flex-wrap gap-3">
        <Button href="/register">Register as a Lawyer</Button>
        <Button href="/contact" variant="outline">Contact our team</Button>
      </div>
    </ContentPage>
  );
}
