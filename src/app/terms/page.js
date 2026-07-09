import { createMetadata } from '@/lib/metadata';
import { SITE, CONTACT } from '@/constants/site';
import ContentPage from '@/components/shared/ContentPage';

export const metadata = createMetadata({
  title: 'Terms of Service',
  description: `The terms that govern your use of ${SITE.name}.`,
  path: '/terms',
});

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="The terms that govern your use of our platform."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]}
      updated="9 July 2026"
    >
      <p>
        By accessing or using {SITE.name}, you agree to these Terms. If you do not agree, please do
        not use the platform.
      </p>

      <h2>About the platform</h2>
      <p>
        {SITE.name} is an advocate discovery and directory platform. We are <strong>not a law firm</strong>
        {' '}and do not provide legal advice, representation or referrals. We simply help clients find
        and contact advocates.
      </p>

      <h2>Advocate accounts</h2>
      <ul>
        <li>You must provide accurate, up-to-date information and be entitled to practise as an advocate.</li>
        <li>You are responsible for your account credentials and all activity under your account.</li>
        <li>You must not post false, misleading, unlawful or infringing content.</li>
        <li>We may suspend or remove profiles that violate these Terms.</li>
      </ul>

      <h2>Client use</h2>
      <p>
        Listings do not constitute endorsements. You are responsible for independently verifying an
        advocate&apos;s credentials and for any engagement you enter into with them.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The platform, its design and branding belong to {SITE.name}. Content you submit remains yours,
        but you grant us a licence to display it on the platform.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        The platform is provided &quot;as is&quot;. To the extent permitted by law, we are not liable
        for any dealings between clients and advocates, or for any loss arising from use of the platform.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use of the platform means you accept the
        updated Terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
      </p>
    </ContentPage>
  );
}
