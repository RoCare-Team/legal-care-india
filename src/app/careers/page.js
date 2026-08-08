import { createMetadata } from '@/lib/metadata';
import { CONTACT } from '@/constants/site';
import ContentPage from '@/components/shared/ContentPage';
import { Button } from '@/components/ui';

export const metadata = createMetadata({
  title: 'Careers at Justiceland | Work With Us',
  description:
    'Help build the platform Indians use to find and consult a lawyer. How we work, what to send, and where — engineering, design, content and operations.',
  path: '/careers',
  keywords: [
    'justiceland careers',
    'legal tech jobs india',
    'startup jobs gurugram',
    'work at justiceland',
  ],
});

export default function CareersPage() {
  return (
    <ContentPage
      eyebrow="Company"
      title="Careers at Justiceland"
      subtitle="Help us make legal help accessible to everyone in India."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Careers' }]}
    >
      <p>
        We&apos;re a small, ambitious team building the most trusted way to discover verified lawyers
        across India. If you care about access to justice and love building great products, we&apos;d
        love to hear from you.
      </p>

      <h2>Areas we hire for</h2>
      <ul>
        <li>Engineering (web, backend, mobile)</li>
        <li>Product &amp; design</li>
        <li>Growth &amp; marketing</li>
        <li>Lawyer onboarding &amp; support</li>
      </ul>

      <h2>How we work</h2>
      <p>
        We are small, which sets the tone for everything else. There is no layer between deciding
        something and shipping it, so whoever owns a piece of work owns it end to end — the research,
        the build, and what happens after it goes live. Feedback is direct and comes quickly, and the
        person best placed to make a call usually makes it rather than escalating.
      </p>
      <p>
        The product is used by people at a stressful point in their lives and by lawyers whose
        livelihoods depend on it working. That shapes the standard we hold ourselves to: we would rather
        ship something narrower and correct than something broad and unreliable, and we do not overstate
        what the platform can do.
      </p>

      <h2>Current openings</h2>
      <p>
        We don&apos;t have any specific openings listed right now — but we&apos;re always glad to meet
        talented people. If you think you can help us grow, reach out.
      </p>

      <h2>What to send</h2>
      <p>
        A résumé is fine, but what actually helps is seeing something you have built or written: a
        repository, a live product, a case study, a piece of writing. Tell us what the problem was, what
        you chose to do about it, and what you would do differently now. A short, specific note beats a
        long, general one.
      </p>
      <p>
        We read everything that comes in and reply either way. If there is no fit at the moment, we will
        say so plainly rather than leave you waiting.
      </p>

      <h2>How to apply</h2>
      <p>
        Send your résumé and a short note about what you&apos;d like to work on to{' '}
        <a href={`mailto:${CONTACT.infoEmail}`}>{CONTACT.infoEmail}</a>.
      </p>

      <div className="not-prose mt-8">
        <Button href={`mailto:${CONTACT.infoEmail}`}>Email us your résumé</Button>
      </div>
    </ContentPage>
  );
}
