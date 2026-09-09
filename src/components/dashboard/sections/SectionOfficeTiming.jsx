import { Building2, Clock } from 'lucide-react';
import { FormField, Input, Textarea } from '@/components/ui';
import DashboardSection from '../DashboardSection';
import RepeatableList from '../RepeatableList';

/**
 * SectionOfficeTiming — office address and weekly timing rows.
 *
 * Every control carries an id and every label points at it. They did not, and
 * the effect was not cosmetic: `FormField` renders `<label htmlFor={undefined}>`
 * when it is given nothing, so "Address" was a label attached to no control —
 * clicking it did nothing and a screen reader announced an unnamed textbox.
 * The repeated timing rows take the row index, since two rows would otherwise
 * both claim the same id and the browser would bind both labels to the first.
 */
export default function SectionOfficeTiming({ data, set }) {
  return (
    <>
      <DashboardSection id="office" title="Office Details" description="Where clients can meet you." icon={Building2}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Office / Chamber Name" htmlFor="d-office-name" className="sm:col-span-2">
            <Input
              id="d-office-name"
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

      <DashboardSection id="timing" title="Office Timing" description="Set your availability for each day." icon={Clock}>
        <RepeatableList
          items={data.timing}
          onChange={(v) => set('timing', v)}
          template={{ day: '', hours: '', open: true }}
          addLabel="Add timing row"
          renderRow={(item, update, i) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Day(s)" htmlFor={`d-timing-day-${i}`}>
                <Input
                  id={`d-timing-day-${i}`}
                  value={item.day}
                  onChange={(e) => update({ day: e.target.value })}
                  placeholder="e.g. Monday – Friday"
                />
              </FormField>
              <FormField label="Hours" htmlFor={`d-timing-hours-${i}`}>
                <Input
                  id={`d-timing-hours-${i}`}
                  value={item.hours}
                  onChange={(e) => update({ hours: e.target.value })}
                  placeholder="e.g. 10:00 AM – 7:00 PM"
                />
              </FormField>
            </div>
          )}
        />
      </DashboardSection>
    </>
  );
}
