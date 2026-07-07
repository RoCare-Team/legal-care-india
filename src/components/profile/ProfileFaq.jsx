import { HelpCircle, ChevronDown } from 'lucide-react';
import ProfileSection from './ProfileSection';

/**
 * ProfileFaq — accordion of frequently asked questions.
 * Uses native <details>/<summary> so it works without client JS and stays
 * fully accessible; the chevron rotates via the `group-open` state.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileFaq({ advocate }) {
  const faqs = advocate.faqs || [];
  if (faqs.length === 0) return null;

  return (
    <ProfileSection id="faq" title="Frequently Asked Questions" icon={HelpCircle}>
      <div className="divide-y divide-ink/8">
        {faqs.map((f, i) => (
          <details key={i} className="group py-3 first:pt-0 last:pb-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 text-sm font-medium text-ink marker:hidden">
              {f.q}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-ink/40 transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="mt-2 pr-8 text-sm leading-relaxed text-ink/65">{f.a}</p>
          </details>
        ))}
      </div>
    </ProfileSection>
  );
}
