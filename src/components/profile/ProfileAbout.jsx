import { UserRound } from 'lucide-react';
import ProfileSection from './ProfileSection';

/**
 * ProfileAbout — the advocate's biography / about section.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileAbout({ advocate }) {
  return (
    <ProfileSection id="about" title="About" icon={UserRound}>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink/70 sm:text-base">
        {advocate.about}
      </p>
    </ProfileSection>
  );
}
