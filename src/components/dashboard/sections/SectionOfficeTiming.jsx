import { Building2, Clock } from 'lucide-react';
import { FormField, Input, Textarea } from '@/components/ui';
import DashboardSection from '../DashboardSection';
import RepeatableList from '../RepeatableList';
import OfficeTimingRow from '../OfficeTimingRow';

/**
 * SectionOfficeTiming — office address and weekly timing rows.
 *
 * Every control carries an id and every label points at it. They did not, and
 * the effect was not cosmetic: `FormField` renders `<label htmlFor={undefined}>`
 * when it is given nothing, so "Address" was a label attached to no control —
 * clicking it did nothing and a screen reader announced an unnamed textbox.
 * The repeated timing rows take the row index, since two rows would otherwise
 * both claim the same id and the browser would bind both labels to the first.
 *
 * Each timing row is day chips + two time pickers (OfficeTimingRow), not free
 * text — see that component for how it still writes the plain "Monday –
 * Friday" / "10:00 AM – 7:00 PM" strings the public profile reads.
 *
 * `showErrors` reddens the office name once the lawyer has tried to move on
 * without it — see EditProfileForm / ProfileSetupStepper.
 */
export default function SectionOfficeTiming({ data, set, showErrors = false }) {
  const officeNameMissing = showErrors && !String(data.officeName || '').trim();

  return (
    <>
      <DashboardSection id="office" title="Office Details" description="Where clients can meet you." icon={Building2}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Office / Chamber Name"
            htmlFor="d-office-name"
            required
            className="sm:col-span-2"
            error={officeNameMissing ? 'Add your office or chamber name before saving.' : ''}
          >
            <Input
              id="d-office-name"
              invalid={officeNameMissing}
              value={data.officeName}
              onChange={(e) => set('officeName', e.target.value)}
              placeholder="e.g. Sharma Legal Chambers"
            />
          </FormField>
          <FormField label="Address" htmlFor="d-office-address" className="sm:col-span-2">
            <Textarea
              id="d-office-address"
              rows={2}
              value={data.officeAddress}
              onChange={(e) => set('officeAddress', e.target.value)}
              placeholder="Street, area, city"
            />
          </FormField>
          <FormField label="Pincode" htmlFor="d-office-pincode">
            <Input
              id="d-office-pincode"
              value={data.pincode}
              onChange={(e) => set('pincode', e.target.value)}
              inputMode="numeric"
              maxLength={6}
              placeholder="302001"
            />
          </FormField>
        </div>
      </DashboardSection>

      <DashboardSection id="timing" title="Office Timing" description="Pick the days and the hours you are there." icon={Clock}>
        <RepeatableList
          items={data.timing}
          onChange={(v) => set('timing', v)}
          template={{ day: '', hours: '', open: true }}
          addLabel="Add timing row"
          renderRow={(item, update, i) => (
            <OfficeTimingRow item={item} update={update} index={i} idPrefix="office-timing" />
          )}
        />
      </DashboardSection>
    </>
  );
}
