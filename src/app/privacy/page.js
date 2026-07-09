import { createMetadata } from '@/lib/metadata';
import { SITE, CONTACT } from '@/constants/site';
import ContentPage from '@/components/shared/ContentPage';

export const metadata = createMetadata({
  title: 'Privacy Policy',
  description: `How ${SITE.name} collects, uses and protects your personal information.`,
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How we collect, use and protect your information."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}
      updated="9 July 2026"
    >
      <p>
        {SITE.name} (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy explains what
        information we collect when you use our advocate directory platform and how we use it.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Advocate accounts:</strong> name, email, phone, city, bar council number, professional details, photos and any profile content you provide.</li>
        <li><strong>Visitors:</strong> search queries and basic usage data to improve the service.</li>
        <li><strong>Contact requests:</strong> details you submit through our contact or enquiry forms.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To create and display advocate profiles in the public directory.</li>
        <li>To let clients discover and contact advocates.</li>
        <li>To operate, secure and improve the platform.</li>
        <li>To send account-related messages such as password reset codes.</li>
      </ul>

      <h2>Public profiles</h2>
      <p>
        Information an advocate adds to their profile (including name, city, contact details and
        photos) is <strong>publicly visible</strong> by design, so that clients can find and reach
        them. Do not add information you do not want to be public.
      </p>

      <h2>Data security</h2>
      <p>
        Passwords are stored only as secure hashes and are never visible to us. We use reasonable
        technical measures to protect your data, but no online service can be guaranteed 100% secure.
      </p>

      <h2>Your choices</h2>
      <p>
        You can edit your profile at any time from your dashboard, or permanently delete your account
        (Dashboard → Settings → Delete account). To raise any privacy request, contact us at{' '}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
      </p>
    </ContentPage>
  );
}
