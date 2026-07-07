import { Building2, Clock } from 'lucide-react';
import { FormField, Input, Textarea } from '@/components/ui';
import DashboardSection from '../DashboardSection';
import RepeatableList from '../RepeatableList';

/**
 * SectionOfficeTiming — office address and weekly timing rows.
 */
export default function SectionOfficeTiming({ data, set }) {
  return (
    <>
      <DashboardSection id="office" title="Office Details" description="Where clients can meet you." icon={Building2}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Office / Chamber Name" className="sm:col-span-2">
            <Input value={data.officeName} onChange={(e) => set('officeName', e.target.value)} />
          </FormField>
          <FormField label="Address" className="sm:col-span-2">
            <Textarea rows={2} value={data.officeAddress} onChange={(e) => set('officeAddress', e.target.value)} />
          </FormField>
          <FormField label="Pincode">
            <Input value={data.pincode} onChange={(e) => set('pincode', e.target.value)} />
          </FormField>
        </div>
      </DashboardSection>

      <DashboardSection id="timing" title="Office Timing" description="Set your availability for each day." icon={Clock}>
        <RepeatableList
          items={data.timing}
          onChange={(v) => set('timing', v)}
          template={{ day: '', hours: '', open: true }}
          addLabel="Add timing row"
          renderRow={(item, update) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Day(s)">
                <Input value={item.day} onChange={(e) => update({ day: e.target.value })} placeholder="e.g. Monday – Friday" />
              </FormField>
              <FormField label="Hours">
                <Input value={item.hours} onChange={(e) => update({ hours: e.target.value })} placeholder="e.g. 10:00 AM – 7:00 PM" />
              </FormField>
            </div>
          )}
        />
      </DashboardSection>
    </>
  );
}
