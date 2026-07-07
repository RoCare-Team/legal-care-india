import { Award, FileBadge } from 'lucide-react';
import ProfileSection from './ProfileSection';

/**
 * ProfileCredentials — certificates and awards, side by side.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileCredentials({ advocate }) {
  const { certificates = [], awards = [] } = advocate;

  return (
    <ProfileSection id="credentials" title="Certificates & Awards" icon={Award}>
      <div className="grid gap-6 sm:grid-cols-2">
        <CredentialList
          icon={FileBadge}
          heading="Certificates"
          items={certificates}
          renderMeta={(c) => `${c.issuer} · ${c.year}`}
        />
        <CredentialList
          icon={Award}
          heading="Awards & Recognition"
          items={awards}
          renderMeta={(a) => `${a.org} · ${a.year}`}
        />
      </div>
    </ProfileSection>
  );
}

function CredentialList({ icon: Icon, heading, items, renderMeta }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink/45">
        {heading}
      </h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={`${item.title}-${i}`} className="flex gap-3 rounded-xl bg-muted/40 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{item.title}</p>
              <p className="text-xs text-ink/55">{renderMeta(item)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
