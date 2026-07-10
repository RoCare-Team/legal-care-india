import { AlignLeft, Scale, Languages as LangIcon } from 'lucide-react';
import { FormField, Textarea } from '@/components/ui';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import { LEGAL_SERVICE_NAMES, getSubServices } from '@/data/categories';
import { LANGUAGES } from '@/data/languages';
import DashboardSection from '../DashboardSection';

/**
 * SectionAboutServices — about text, legal services and languages.
 */
export default function SectionAboutServices({ data, set }) {
  const subServices = data.subServices || [];

  const onServicesChange = (nextServices) => {
    set('services', nextServices);
    const allowed = new Set(nextServices.flatMap((s) => getSubServices(s)));
    const pruned = subServices.filter((s) => allowed.has(s));
    if (pruned.length !== subServices.length) set('subServices', pruned);
  };

  const onSubChange = (options, nextForCategory) => {
    const others = subServices.filter((s) => !options.includes(s));
    set('subServices', [...others, ...nextForCategory]);
  };

  const servicesWithSubs = (data.services || []).filter((s) => getSubServices(s).length > 0);

  return (
    <>
      <DashboardSection id="about" title="About" description="Tell clients about your practice and approach." icon={AlignLeft}>
        <FormField label="About You" htmlFor="d-about" hint={`${data.about.length} characters`}>
          <Textarea id="d-about" rows={6} value={data.about} onChange={(e) => set('about', e.target.value)} />
        </FormField>
      </DashboardSection>

      <DashboardSection id="services" title="Legal Services" description="Select the services you practise (up to 4), then the specific areas under each." icon={Scale}>
        <ChipMultiSelect options={LEGAL_SERVICE_NAMES} value={data.services} onChange={onServicesChange} max={4} />

        {servicesWithSubs.length > 0 && (
          <div className="mt-5 space-y-4 rounded-xl border border-ink/8 bg-muted/30 p-4">
            <p className="text-sm font-medium text-ink/80">
              Specific areas you handle{' '}
              <span className="font-normal text-ink/45">(optional)</span>
            </p>
            {servicesWithSubs.map((service) => {
              const options = getSubServices(service);
              const selected = subServices.filter((s) => options.includes(s));
              return (
                <div key={service}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary/80">
                    {service}
                  </p>
                  <ChipMultiSelect
                    options={options}
                    value={selected}
                    onChange={(next) => onSubChange(options, next)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </DashboardSection>

      <DashboardSection id="languages" title="Languages" description="Languages you can consult in." icon={LangIcon}>
        <ChipMultiSelect options={LANGUAGES} value={data.languages} onChange={(v) => set('languages', v)} />
      </DashboardSection>
    </>
  );
}
