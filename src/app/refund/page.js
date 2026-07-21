import { createMetadata } from '@/lib/metadata';
import { SITE, CONTACT } from '@/constants/site';
import ContentPage from '@/components/shared/ContentPage';

export const metadata = createMetadata({
  title: 'Refund Policy',
  description: `Refund and cancellation policy for ${SITE.name}.`,
  path: '/refund',
});

export default function RefundPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Refund & Cancellation Policy"
      subtitle="How payments, refunds and cancellations work."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Refund Policy' }]}
      updated="9 July 2026"
    >
      <h2>Free directory listing</h2>
      <p>
        Creating a lawyer profile and appearing in the {SITE.name} directory is currently{' '}
        <strong>free of charge</strong>. There is nothing to refund for a free listing.
      </p>

      <h2>Paid plans (when available)</h2>
      <p>
        If we introduce paid or premium plans in future, the following will apply unless stated
        otherwise at the time of purchase:
      </p>
      <ul>
        <li>You may cancel a subscription at any time from your dashboard; it will not renew for the next cycle.</li>
        <li>Fees already paid for the current billing period are generally non-refundable.</li>
        <li>If you are charged in error or due to a technical fault, contact us and we will review and, where appropriate, refund it.</li>
      </ul>

      <h2>Consultation fees</h2>
      <p>
        Any consultation or professional fee you pay <strong>directly to a lawyer</strong> is between
        you and that lawyer. {SITE.name} does not collect these fees and is not responsible for their
        refund. Please discuss fee and refund terms directly with the lawyer.
      </p>

      <h2>How to request a refund</h2>
      <p>
        For any eligible refund, email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> with your
        account email and payment details. Approved refunds are processed to the original payment method,
        typically within 5–7 working days.
      </p>
    </ContentPage>
  );
}
