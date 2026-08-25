import { Container } from '@/components/ui';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileContactCard from '@/components/profile/ProfileContactCard';
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
  return (
    <>
      <Container className="py-6 pb-28 sm:py-8 lg:pb-8">
        {notice}
        <ProfileHeader advocate={advocate} />

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ProfileAbout advocate={advocate} />
            <ProfileLegalServices advocate={advocate} />
            <ProfileEducation advocate={advocate} />
            <ProfileOffice advocate={advocate} />
            <ProfileGallery advocate={advocate} />
            <ProfileCredentials advocate={advocate} />
            <ProfileReviews advocate={advocate} />
            <ProfileFaq advocate={advocate} />
          </div>

          <div className="lg:col-span-1">
            <ProfileContactCard advocate={advocate} />
          </div>
        </div>
      </Container>

      <RelatedAdvocates advocates={related} />
      <ProfileMobileBar advocate={advocate} />
    </>
  );
}
