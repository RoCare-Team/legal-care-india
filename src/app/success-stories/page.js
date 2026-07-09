import { createMetadata } from '@/lib/metadata';
import { SITE } from '@/constants/site';
import ContentPage from '@/components/shared/ContentPage';
import { Button } from '@/components/ui';

export const metadata = createMetadata({
  title: 'Success Stories',
  description: `Real outcomes from clients and advocates on ${SITE.name}.`,
  path: '/success-stories',
});

export default function SuccessStoriesPage() {
  return (
    <ContentPage
      eyebrow="For Advocates"
      title="Success Stories"
      subtitle="How clients and advocates connect and grow on our platform."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Success Stories' }]}
    >
      <p>
        {SITE.name} is growing every day, connecting people who need legal help with verified advocates
        across India. As our community grows, we&apos;ll feature real stories from clients and advocates
        here.
      </p>

      <h2>For clients</h2>
      <p>
        Thousands of people use the platform to search, compare and directly contact advocates by legal
        service, city and experience — without any middlemen.
      </p>

      <h2>For advocates</h2>
      <p>
        A complete, verified profile helps advocates get discovered by clients actively looking for their
        expertise, and receive enquiries directly by call, WhatsApp or email.
      </p>

      <h2>Share your story</h2>
      <p>
        Have a great experience to share? We&apos;d love to hear it and may feature it on this page.
      </p>

      <div className="not-prose mt-8 flex flex-wrap gap-3">
        <Button href="/advocates">Find an Advocate</Button>
        <Button href="/register" variant="outline">Register as an Advocate</Button>
      </div>
    </ContentPage>
  );
}
