import { FileBadge, Award } from 'lucide-react';
import { FormField, Input } from '@/components/ui';
import DashboardSection from '../DashboardSection';
import RepeatableList from '../RepeatableList';

/**
 * SectionCredentials — certificates and awards editors.
 */
export default function SectionCredentials({ data, set }) {
  return (
    <>
      <DashboardSection id="certificates" title="Certificates" description="Professional certifications and trainings." icon={FileBadge}>
        <RepeatableList
          items={data.certificates}
          onChange={(v) => set('certificates', v)}
          template={{ title: '', issuer: '', year: '' }}
          addLabel="Add certificate"
          renderRow={(item, update) => (
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Title" className="sm:col-span-3">
                <Input value={item.title} onChange={(e) => update({ title: e.target.value })} />
              </FormField>
              <FormField label="Issuer" className="sm:col-span-2">
                <Input value={item.issuer} onChange={(e) => update({ issuer: e.target.value })} />
              </FormField>
              <FormField label="Year">
                <Input type="number" value={item.year} onChange={(e) => update({ year: e.target.value })} />
              </FormField>
            </div>
          )}
        />
      </DashboardSection>

      <DashboardSection id="awards" title="Awards & Recognition" description="Honours you have received." icon={Award}>
        <RepeatableList
          items={data.awards}
          onChange={(v) => set('awards', v)}
          template={{ title: '', org: '', year: '' }}
          addLabel="Add award"
          renderRow={(item, update) => (
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField label="Title" className="sm:col-span-3">
                <Input value={item.title} onChange={(e) => update({ title: e.target.value })} />
              </FormField>
              <FormField label="Organisation" className="sm:col-span-2">
                <Input value={item.org} onChange={(e) => update({ org: e.target.value })} />
              </FormField>
              <FormField label="Year">
                <Input type="number" value={item.year} onChange={(e) => update({ year: e.target.value })} />
              </FormField>
            </div>
          )}
        />
      </DashboardSection>
    </>
  );
}
