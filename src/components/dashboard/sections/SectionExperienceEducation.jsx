import { Briefcase, GraduationCap } from 'lucide-react';
import { FormField, Input } from '@/components/ui';
import DashboardSection from '../DashboardSection';
import RepeatableList from '../RepeatableList';

/**
 * SectionExperienceEducation — bar registration, years and education list.
 */
export default function SectionExperienceEducation({ data, set }) {
  // Won ÷ handled, as a whole percent.
  //
  // `num` rather than Number(): Number('') is 0, so a blank Cases Won read
  // as "won none of them" and printed a confident 0%. Blank means not given,
  // and not given has no answer — hence null, which the field explains.
  const num = (v) => {
    const t = String(v ?? '').trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  const handled = num(data.cases);
  const won = num(data.casesWon);

  // More won than handled is a typo, not a 100% record. Capping it silently
  // turned every such slip into the best possible number, which is the one
  // direction an error here must never round.
  const wonTooMany = handled !== null && won !== null && won > handled;

  const successRate =
    handled !== null && handled > 0 && won !== null && won >= 0 && !wonTooMany
      ? Math.round((won / handled) * 100)
      : null;

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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Cases Handled" htmlFor="d-cases">
            <Input id="d-cases" type="number" min="0" value={data.cases} onChange={(e) => set('cases', e.target.value)} placeholder="e.g. 250" />
          </FormField>
          <FormField
            label="Cases Won"
            htmlFor="d-cases-won"
            hint={wonTooMany ? '' : 'Of the cases handled.'}
            error={wonTooMany ? `Cannot be more than the ${handled} cases handled.` : ''}
          >
            <Input
              id="d-cases-won"
              type="number"
              min="0"
              max={handled ?? undefined}
              value={data.casesWon ?? ''}
              onChange={(e) => set('casesWon', e.target.value)}
              placeholder="e.g. 230"
            />
          </FormField>
          <FormField label="Clients Advised" htmlFor="d-clients">
            <Input id="d-clients" type="number" min="0" value={data.clients} onChange={(e) => set('clients', e.target.value)} placeholder="e.g. 180" />
          </FormField>

          {/* Worked out, not typed. A success rate is won ÷ handled, and
              nothing else on this form implies it — cases and clients are two
              counts of different things, and dividing them would print a
              number on a public profile that measures nothing.

              Read-only for the same reason it is shown at all: it is a claim
              clients rely on, so it has to follow from figures the lawyer
              gave rather than be one more figure they can pick. */}
          <FormField
            label="Success Rate (%)"
            htmlFor="d-success"
            hint={
              wonTooMany
                ? 'Check the cases won.'
                : successRate === null
                  ? 'Fill cases handled and cases won.'
                  : 'Worked out from won ÷ handled.'
            }
          >
            <Input
              id="d-success"
              readOnly
              value={successRate === null ? '' : String(successRate)}
              placeholder="—"
              className="bg-muted/40 text-ink/70"
            />
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
