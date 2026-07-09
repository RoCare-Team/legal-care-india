import { createMetadata } from '@/lib/metadata';
import { SITE, CONTACT } from '@/constants/site';
import ContentPage from '@/components/shared/ContentPage';
import { Button } from '@/components/ui';

export const metadata = createMetadata({
  title: 'Careers',
  description: `Join the team building ${SITE.name} — India's advocate directory platform.`,
  path: '/careers',
});

export default function CareersPage() {
  return (
    <ContentPage
      eyebrow="Company"
      title="Careers at Legal Care India"
      subtitle="Help us make legal help accessible to everyone in India."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Careers' }]}
    >
      <p>
        We&apos;re a small, ambitious team building the most trusted way to discover verified advocates
        across India. If you care about access to justice and love building great products, we&apos;d
        love to hear from you.
      </p>

      <h2>Areas we hire for</h2>
      <ul>
        <li>Engineering (web, backend, mobile)</li>
        <li>Product &amp; design</li>
        <li>Growth &amp; marketing</li>
        <li>Advocate onboarding &amp; support</li>
      </ul>

      <h2>Current openings</h2>
      <p>
        We don&apos;t have any specific openings listed right now — but we&apos;re always glad to meet
        talented people. If you think you can help us grow, reach out.
      </p>

      <h2>How to apply</h2>
      <p>
        Send your résumé and a short note about what you&apos;d like to work on to{' '}
        <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
      </p>

      <div className="not-prose mt-8">
        <Button href={`mailto:${CONTACT.email}`}>Email us your résumé</Button>
      </div>
    </ContentPage>
  );
}
