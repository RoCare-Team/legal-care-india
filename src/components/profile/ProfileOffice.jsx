import { Building2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui';
import ProfileSection from './ProfileSection';

/**
 * ProfileOffice — office name, address and an embedded Google map.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileOffice({ advocate }) {
  const { office = {} } = advocate;
  const mapQuery = encodeURIComponent(office.mapQuery || `${office.address}`);

  return (
    <ProfileSection id="office" title="Office & Location" icon={Building2}>
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="font-medium text-ink">{office.name}</p>
          <p className="mt-2 flex items-start gap-2 text-sm text-ink/65">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              {office.address}
              {office.pincode ? ` - ${office.pincode}` : ''}
            </span>
          </p>
          <Button
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="sm"
            className="mt-4"
            leftIcon={<Navigation className="h-4 w-4" />}
          >
            Get Directions
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-ink/10 lg:col-span-3">
          <iframe
            title={`Map showing ${office.name}`}
            src={`https://maps.google.com/maps?q=${mapQuery}&z=14&output=embed`}
            className="h-64 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </ProfileSection>
  );
}
