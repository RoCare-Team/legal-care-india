'use client';

import { FormField } from '@/components/ui';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import { LEGAL_SERVICE_NAMES, getSubServices } from '@/data/categories';
import { CITIES } from '@/data/cities';
import { allCitiesForState } from '@/data/indiaLocations';
import { COURTS } from '@/data/courts';
import FormSection from './FormSection';

/**
 * StepPractice — the courts, areas and matters an advocate takes (step 3 of 5).
 *
 * Everything here is a chip rather than a select. These are multi-answer
 * questions where the options are worth reading — an advocate scanning "Motor
 * Accident Claims Tribunal" among fifteen courts is doing something a dropdown
 * makes harder, not easier.
 *
 * Languages are asked on step 1 with the rest of the personal details, so they
 * are not repeated here.
 *
 * @param {object} props
 * @param {object} props.data
 * @param {(field:string,value:any)=>void} props.set
 * @param {Record<string,string>} props.errors
 * @param {Array<{slug:string,name:string,state:string}>} [props.cities]
 */
export default function StepPractice({ data, set, errors, cities = CITIES }) {
  const subServices = data.subServices || [];

  // Picking main areas prunes any expertise whose parent area was removed —
  // otherwise a lawyer could drop "Criminal Law" and still be listed under
  // "Bail Matters".
  const onServicesChange = (nextServices) => {
    set('services', nextServices);
    const allowed = new Set(nextServices.flatMap((s) => getSubServices(s)));
    const pruned = subServices.filter((s) => allowed.has(s));
    if (pruned.length !== subServices.length) set('subServices', pruned);
  };

  // Merge one area's expertise selection back into the flat list.
  const onSubChange = (options, nextForArea) => {
    const others = subServices.filter((s) => !options.includes(s));
    set('subServices', [...others, ...nextForArea]);
  };

  // Selected areas that actually have matters to offer.
  const areasWithExpertise = (data.services || []).filter((s) => getSubServices(s).length > 0);

  // Practice cities stay within the chosen state, and exclude the base city —
  // it already counts as one the advocate serves.
  const practiceCityOptions = allCitiesForState(data.state, cities)
    .filter((name) => name !== data.city);

  return (
    <div className="space-y-6">
      <FormSection
        title="Courts you practise in"
        description="Where do you appear? Select all that apply."
      >
        <FormField required error={errors.courts}>
          <ChipMultiSelect
            options={COURTS}
            value={data.courts || []}
            onChange={(next) => set('courts', next)}
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Practice areas"
        description="These decide which listings you appear on."
      >
        <FormField required error={errors.services}>
          <ChipMultiSelect
            options={LEGAL_SERVICE_NAMES}
            value={data.services || []}
            onChange={onServicesChange}
          />
        </FormField>
      </FormSection>

      {areasWithExpertise.length > 0 && (
        <FormSection
          title="Special expertise"
          description="Clients search by these — pick the ones you genuinely take."
        >
          <div className="space-y-4">
            {areasWithExpertise.map((service) => {
              const options = getSubServices(service);
              return (
                <div key={service}>
                  <p className="mb-2.5 text-[13px] font-semibold text-ink/70">{service}</p>
                  <ChipMultiSelect
                    options={options}
                    value={subServices.filter((s) => options.includes(s))}
                    onChange={(next) => onSubChange(options, next)}
                  />
                </div>
              );
            })}
          </div>
        </FormSection>
      )}

      <FormSection
        title="Cities you work in"
        description={
          data.state
            ? `Other cities in ${data.state} you take cases in, besides ${data.city || 'your base city'}.`
            : 'Choose your state on the first step to see the cities here.'
        }
      >
        <FormField error={errors.practiceCities}>
          <ChipMultiSelect
            options={practiceCityOptions}
            value={data.practiceCities || []}
            onChange={(next) => set('practiceCities', next)}
          />
        </FormField>
      </FormSection>
    </div>
  );
}
