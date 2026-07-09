import { GraduationCap } from 'lucide-react';
import ProfileSection from './ProfileSection';

/**
 * ProfileEducation — academic qualifications timeline.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileEducation({ advocate }) {
  const education = (advocate.education || []).filter((e) => e && e.degree);
  // Hide the section entirely until the advocate adds qualifications.
  if (education.length === 0) return null;

  return (
    <ProfileSection id="education" title="Education" icon={GraduationCap}>
      <ol className="space-y-5">
        {education.map((e, i) => (
          <li key={`${e.degree}-${i}`} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
              {i < education.length - 1 && (
                <span className="mt-1 w-px flex-1 bg-ink/10" aria-hidden="true" />
              )}
            </div>
            <div className="-mt-1 pb-1">
              <p className="font-medium text-ink">{e.degree}</p>
              <p className="text-sm text-ink/60">{e.institute}</p>
              <p className="mt-0.5 text-xs text-ink/45">{e.year}</p>
            </div>
          </li>
        ))}
      </ol>
    </ProfileSection>
  );
}
