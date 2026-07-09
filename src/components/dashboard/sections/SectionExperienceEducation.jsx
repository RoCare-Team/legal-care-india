import { Briefcase, GraduationCap } from 'lucide-react';
import { FormField, Input } from '@/components/ui';
import DashboardSection from '../DashboardSection';
import RepeatableList from '../RepeatableList';

/**
 * SectionExperienceEducation — bar registration, years and education list.
 */
export default function SectionExperienceEducation({ data, set }) {
  return (
    <>
      <DashboardSection id="experience" title="Experience" description="Your Bar Council registration and years of practice." icon={Briefcase}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Bar Council Number" htmlFor="d-bar">
            <Input id="d-bar" value={data.barCouncil} onChange={(e) => set('barCouncil', e.target.value)} />
          </FormField>
          <FormField label="Years of Experience" htmlFor="d-exp">
            <Input id="d-exp" type="number" min="0" value={data.experience} onChange={(e) => set('experience', e.target.value)} />
          </FormField>
        </div>

        <p className="mt-6 mb-3 text-sm font-medium text-ink">
          Practice Highlights{' '}
          <span className="font-normal text-ink/45">(shown on your public profile — leave 0 to hide)</span>
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <FormField label="Cases Handled" htmlFor="d-cases">
            <Input id="d-cases" type="number" min="0" value={data.cases} onChange={(e) => set('cases', e.target.value)} placeholder="e.g. 250" />
          </FormField>
          <FormField label="Clients Advised" htmlFor="d-clients">
            <Input id="d-clients" type="number" min="0" value={data.clients} onChange={(e) => set('clients', e.target.value)} placeholder="e.g. 180" />
          </FormField>
          <FormField label="Success Rate (%)" htmlFor="d-success">
            <Input id="d-success" type="number" min="0" max="100" value={data.successRate} onChange={(e) => set('successRate', e.target.value)} placeholder="e.g. 92" />
          </FormField>
        </div>
      </DashboardSection>

      <DashboardSection id="education" title="Education" description="Add your degrees and qualifications." icon={GraduationCap}>
        <RepeatableList
          items={data.education}
          onChange={(v) => set('education', v)}
          template={{ degree: '', institute: '', year: '' }}
          addLabel="Add qualification"
          renderRow={(item, update) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Degree" className="sm:col-span-2">
                <Input value={item.degree} onChange={(e) => update({ degree: e.target.value })} placeholder="e.g. LL.B." />
              </FormField>
              <FormField label="Institute">
                <Input value={item.institute} onChange={(e) => update({ institute: e.target.value })} />
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
