import { useMemo } from 'react';
import { Wifi, Globe } from 'lucide-react';
import { FormField, Select } from '@/components/ui';
import { timezoneOptions } from '@/utils/timezones';
import DashboardSection from '../DashboardSection';
import RepeatableList from '../RepeatableList';
import OfficeTimingRow from '../OfficeTimingRow';

/**
 * SectionAvailability — "Usually Online": the weekly hours a lawyer typically
 * takes live consultations, shown on their public profile and, on the
 * dashboard, right where the actual Online/Offline switch is (see
 * LiveStatusBanner's link here).
 *
 * Purely informational. The Online/Offline switch itself stays exactly as
 * manual as it always was — nothing here flips it, and this never claims the
 * lawyer is online right now, only when they usually are. Reuses the same day
 * chips + time pickers as Office Timing (OfficeTimingRow), because the two are
 * the same kind of thing: which days, and which hours on them.
 *
 * The timezone applies to this whole schedule, not one row each — a lawyer
 * has one clock, and every time picker below reads by it. Defaults to India,
 * since every lawyer here practises from it today, but is never assumed
 * silently: the plain "10:00 PM" a schedule is made of means nothing without
 * saying which 10pm.
 */
export default function SectionAvailability({ data, set }) {
  const timezones = useMemo(() => timezoneOptions(), []);

  return (
    <DashboardSection
      id="availability"
      title="Usually Online"
      description="When clients can typically reach you for a chat, call or video consultation. Shown on your public profile — it never switches you online or offline by itself; that is still the switch on your dashboard."
      icon={Wifi}
    >
      <FormField label="Timezone" htmlFor="d-timezone" className="mb-5 max-w-sm">
        <Select
          id="d-timezone"
          value={data.timezone || 'Asia/Kolkata'}
          onChange={(e) => set('timezone', e.target.value)}
          options={timezones}
          leftIcon={<Globe className="h-4 w-4 text-ink/40" aria-hidden="true" />}
        />
      </FormField>

      <RepeatableList
        items={data.availabilitySchedule}
        onChange={(v) => set('availabilitySchedule', v)}
        template={{ day: '', hours: '', open: true }}
        addLabel="Add a day"
        renderRow={(item, update, i) => (
          <OfficeTimingRow
            item={item}
            update={update}
            index={i}
            idPrefix="availability"
            openLabel="I usually take consultations on these days"
          />
        )}
      />
    </DashboardSection>
  );
}
