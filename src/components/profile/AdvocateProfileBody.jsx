import { Container } from '@/components/ui';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import ProfileContactCard from '@/components/profile/ProfileContactCard';
import ProfileCoverage from '@/components/profile/ProfileCoverage';
import ProfileTrustCard from '@/components/profile/ProfileTrustCard';
import ProfileAbout from '@/components/profile/ProfileAbout';
import ProfileLegalServices from '@/components/profile/ProfileLegalServices';
import ProfileEducation from '@/components/profile/ProfileEducation';
import ProfileOffice from '@/components/profile/ProfileOffice';
import ProfileGallery from '@/components/profile/ProfileGallery';
import ProfileCredentials from '@/components/profile/ProfileCredentials';
import ProfileReviews from '@/components/profile/ProfileReviews';
import ProfileFaq from '@/components/profile/ProfileFaq';
import ProfileMobileBar from '@/components/profile/ProfileMobileBar';
import RelatedAdvocates from '@/components/profile/RelatedAdvocates';

/**
 * AdvocateProfileBody — everything a lawyer's profile page shows.
 *
 * Shared by the public page and the admin's preview of an unapproved profile.
 * They must show the same thing: a preview that drifts from the real page is
 * worse than none, because approvals get made against a page nobody will see.
 *
 * @param {object} props
 * @param {object} props.advocate      built profile
 * @param {Array}  [props.related]     related lawyers for the footer band
 * @param {React.ReactNode} [props.notice]  banner above the header (preview)
 */
export default function AdvocateProfileBody({ advocate, related = [], notice }) {
  const faqs = advocate.faqs || [];
  const education = (advocate.education || []).filter((e) => e && e.degree);
  const gallery = (advocate.gallery || []).filter(Boolean);

  return (
    <>
      {/* The header and the tabs are bands, like the navbar above them: the
          white surface reaches both edges of the window and only what is
          written on it is held to the site's column, so the portrait starts
          on the logo's left edge. The body below keeps the column. */}
      <div className="pb-28 lg:pb-12">
        {notice}
        <ProfileHeader advocate={advocate} />

        {/* Only the sections this lawyer actually filled in. A tab that
            jumps nowhere is worse than a missing tab. */}
        <ProfileTabs
          tabs={[
            { id: 'about', label: 'About' },
            ...(advocate.legalServices?.length || advocate.specializations?.length
              ? [{ id: 'legal-services', label: 'Legal Services' }]
              : []),
            ...(education.length ? [{ id: 'education', label: 'Education' }] : []),
            ...(advocate.office?.address ? [{ id: 'office', label: 'Office' }] : []),
            ...(gallery.length ? [{ id: 'gallery', label: 'Gallery' }] : []),
            { id: 'reviews', label: 'Reviews' },
            ...(faqs.length ? [{ id: 'faq', label: 'FAQs' }] : []),
          ]}
        />

        <Container className="mt-6 grid gap-5 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-5">
            <ProfileAbout advocate={advocate} />
            {/* Below lg there is no sidebar beside the body, and the courts
                and cities are worth more straight after About than under the
                FAQ at the very bottom. */}
            <ProfileCoverage advocate={advocate} className="lg:hidden" />
            <ProfileLegalServices advocate={advocate} />
            <ProfileEducation advocate={advocate} />
            <ProfileOffice advocate={advocate} />
            <ProfileGallery advocate={advocate} />
            <ProfileCredentials advocate={advocate} />
            <ProfileReviews advocate={advocate} />
            <ProfileFaq advocate={advocate} />
          </div>

          {/* The column stretches to the body's full height, so the last card
              can stick while the reader scrolls a long profile. */}
          <div className="space-y-5">
            <ProfileCoverage advocate={advocate} className="hidden lg:block" />
            <ProfileContactCard advocate={advocate} />
            <div className="lg:sticky lg:top-[136px]">
              <ProfileTrustCard />
            </div>
          </div>
        </Container>
      </div>

      <RelatedAdvocates advocates={related} />
      {/* The bar is a client component, so whatever it is handed is written
          into the page for React to hydrate from. It needs six fields; given
          the whole profile it carried the About text, every review and the
          gallery along with them. */}
      <ProfileMobileBar
        advocate={{
          _id: advocate._id,
          name: advocate.name,
          contact: advocate.contact,
          slotPrices: advocate.slotPrices,
          audioRate: advocate.audioRate,
          audioPlans: advocate.audioRate ? undefined : advocate.audioPlans,
        }}
      />
    </>
  );
}
