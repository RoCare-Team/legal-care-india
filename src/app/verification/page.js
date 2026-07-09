import { createMetadata } from '@/lib/metadata';
import { SITE } from '@/constants/site';
import ContentPage from '@/components/shared/ContentPage';
import { Button } from '@/components/ui';

export const metadata = createMetadata({
  title: 'Advocate Verification',
  description: `How ${SITE.name} verifies advocates so clients can connect with confidence.`,
  path: '/verification',
});

export default function VerificationPage() {
  return (
    <ContentPage
      eyebrow="For Advocates"
      title="Advocate Verification"
      subtitle="How we help clients connect with genuine, trustworthy advocates."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Verification' }]}
    >
      <p>
        Trust is at the heart of {SITE.name}. The verification badge tells clients that an advocate&apos;s
        core details have been checked, so they can reach out with confidence.
      </p>

      <h2>What we check</h2>
      <ul>
        <li><strong>Identity:</strong> the advocate&apos;s name and contact details.</li>
        <li><strong>Bar council registration:</strong> a valid bar council enrolment number.</li>
        <li><strong>Practice details:</strong> city, areas of practice and experience.</li>
      </ul>

      <h2>How to get verified</h2>
      <ul>
        <li>Register for a free advocate account.</li>
        <li>Complete your profile, including your bar council number, from the dashboard.</li>
        <li>Our team reviews the details and adds the verified badge once confirmed.</li>
      </ul>

      <h2>Why it matters</h2>
      <p>
        A verified profile ranks better in search, earns more client trust and typically receives more
        enquiries. Keeping your profile complete and accurate is the fastest way to get discovered.
      </p>

      <div className="not-prose mt-8 flex flex-wrap gap-3">
        <Button href="/register">Register as an Advocate</Button>
        <Button href="/contact" variant="outline">Contact our team</Button>
      </div>
    </ContentPage>
  );
}
