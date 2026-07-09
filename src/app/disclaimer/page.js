import { createMetadata } from '@/lib/metadata';
import { SITE, CONTACT } from '@/constants/site';
import ContentPage from '@/components/shared/ContentPage';

export const metadata = createMetadata({
  title: 'Disclaimer',
  description: `Important disclaimer about the use of ${SITE.name}.`,
  path: '/disclaimer',
});

export default function DisclaimerPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Disclaimer"
      subtitle="Please read this before relying on any information on the platform."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Disclaimer' }]}
      updated="9 July 2026"
    >
      <h2>Not a law firm</h2>
      <p>
        {SITE.name} is an advocate discovery and directory platform. It is <strong>not a law firm</strong>
        {' '}and does not provide legal advice, opinions, representation or referrals. Nothing on this
        platform should be treated as legal advice.
      </p>

      <h2>No attorney–client relationship</h2>
      <p>
        Browsing profiles or contacting an advocate through this platform does not create an
        attorney–client relationship. Such a relationship is formed only directly between you and the
        advocate, on terms you agree with them.
      </p>

      <h2>Accuracy of listings</h2>
      <p>
        Profile information is provided by advocates themselves. While we encourage accuracy, we do not
        independently guarantee the qualifications, experience, availability or conduct of any advocate.
        Listings do not constitute endorsements. Please verify credentials independently before engaging
        anyone.
      </p>

      <h2>Your responsibility</h2>
      <p>
        Any decision you make based on information found here is at your own discretion and risk. We are
        not responsible for the outcome of any engagement between clients and advocates.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this disclaimer? Email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
      </p>
    </ContentPage>
  );
}
