import { createMetadata } from '@/lib/metadata';
import { SITE } from '@/constants/site';
import ContentPage from '@/components/shared/ContentPage';
import { Button } from '@/components/ui';

export const metadata = createMetadata({
  title: 'Client & Lawyer Success Stories',
  description:
    'What clients and lawyers actually use Justiceland for, and how to share your own story. No invented testimonials and no numbers we cannot stand behind.',
  path: '/success-stories',
  keywords: [
    'justiceland reviews',
    'client experiences lawyer platform',
    'lawyer success stories india',
  ],
});

export default function SuccessStoriesPage() {
  return (
    <ContentPage
      eyebrow="For Lawyers"
      title="Success Stories"
      subtitle="How clients and lawyers connect and grow on our platform."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Success Stories' }]}
    >
      <p>
        {SITE.name} is growing every day, connecting people who need legal help with verified lawyers
        across India. As our community grows, we&apos;ll feature real stories from clients and lawyers
        here.
      </p>

      <p>
        We would rather leave this page honest than fill it with testimonials nobody wrote. There are no
        invented quotes, no stock photographs of people who never used the platform, and no numbers we
        cannot stand behind. What follows is what the platform is actually for — and when we have real
        stories to publish, with permission, they will replace this.
      </p>

      <h2>What clients use it for</h2>
      <p>
        Most people arrive with a specific problem and no idea who handles it: a builder who has stopped
        answering about possession, a cheque that bounced, a notice with a deadline on it, a separation
        where nobody has spoken to a lawyer yet. The platform is built for that moment. You search by
        the area of law and the city where the matter would be heard, compare lawyers on practice area,
        courts, experience and languages, and see the per-minute consultation rate before you start.
      </p>
      <p>
        You then speak to the lawyer directly, by chat, audio call or video call. There is no
        intermediary relaying your case, no commission taken out of the lawyer&apos;s fee, and no
        obligation to continue after the first consultation. You pay for the minutes you actually use.
      </p>

      <h2>What lawyers use it for</h2>
      <p>
        For a lawyer, the useful part is that enquiries arrive already filtered. Someone who has read
        your practice areas, seen which courts you appear in, checked that you speak their language and
        accepted your rate is a materially better conversation than a cold call. Consultations happen in
        the app, so there is no need to hand out a personal number to be reachable, and the rate is set
        by the lawyer rather than negotiated case by case.
      </p>

      <h2>Share your story</h2>
      <p>
        If the platform helped you resolve something, or helped you build your practice, we would like to
        hear about it. Write to us with what happened in your own words. Nothing gets published without
        your explicit permission, and you decide how you are identified — full name, first name, or
        simply the city and the type of matter.
      </p>

      <div className="not-prose mt-8 flex flex-wrap gap-3">
        <Button href="/lawyers">Find a Lawyer</Button>
        <Button href="/register" variant="outline">Register as a Lawyer</Button>
      </div>
    </ContentPage>
  );
}
