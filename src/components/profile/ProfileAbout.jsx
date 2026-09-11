import { UserRound } from 'lucide-react';
import ProfileSection from './ProfileSection';

/**
 * ProfileAbout — the lawyer's biography.
 *
 * Only the paragraph. The figures that used to follow it — clients, success
 * rate, years — are in the header's fact tiles now, where they are seen before
 * anyone scrolls; repeating them here put "3+ Years" on the page twice.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileAbout({ advocate }) {
  return (
    <ProfileSection id="about" title="About" icon={UserRound}>
      <p className="whitespace-pre-line text-[14.5px] leading-[1.75] text-ink/70 sm:text-[15.5px]">
        {advocate.about}
      </p>
    </ProfileSection>
  );
}
