import { FormField, Input, Select } from '@/components/ui';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import { LEGAL_SERVICE_NAMES, getSubServices } from '@/data/categories';
import { LANGUAGES, STATES } from '@/data/languages';
import { CITIES } from '@/data/cities';
import { COURTS } from '@/data/courts';

const CITY_NAMES = CITIES.map((c) => c.name);

/**
 * StepProfessional — bar registration, experience, services & languages.
 *
 * @param {object} props
 * @param {object} props.data
 * @param {(field:string,value:any)=>void} props.set
 * @param {Record<string,string>} props.errors
 */
export default function StepProfessional({ data, set, errors }) {
  const subServices = data.subServices || [];

  // Pick main services; drop any sub-types whose parent service was removed.
  const onServicesChange = (nextServices) => {
    set('services', nextServices);
    const allowed = new Set(nextServices.flatMap((s) => getSubServices(s)));
    const pruned = subServices.filter((s) => allowed.has(s));
    if (pruned.length !== subServices.length) set('subServices', pruned);
  };

  // Merge a single category's sub-type selection back into the flat list.
  const onSubChange = (options, nextForCategory) => {
    const others = subServices.filter((s) => !options.includes(s));
    set('subServices', [...others, ...nextForCategory]);
  };

  // Selected services that actually have sub-types to offer.
  const servicesWithSubs = (data.services || []).filter((s) => getSubServices(s).length > 0);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField label="Bar Council Number" htmlFor="barCouncil" required error={errors.barCouncil}>
        <Input
          id="barCouncil"
          value={data.barCouncil}
          onChange={(e) => set('barCouncil', e.target.value)}
          placeholder="e.g. D/1234/2015"
          invalid={Boolean(errors.barCouncil)}
        />
      </FormField>

      <FormField label="Years of Experience" htmlFor="experience" required error={errors.experience}>
        <Input
          id="experience"
          type="number"
          min="0"
          value={data.experience}
          onChange={(e) => set('experience', e.target.value)}
          placeholder="e.g. 8"
          invalid={Boolean(errors.experience)}
        />
      </FormField>

      <FormField label="City" htmlFor="city" required error={errors.city}>
        <Select
          id="city"
          value={data.city}
          onChange={(e) => set('city', e.target.value)}
          placeholder="Select city"
          invalid={Boolean(errors.city)}
        >
          <option value="">Select city</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.name}>{c.name}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="State" htmlFor="state" required error={errors.state}>
        <Select
          id="state"
          value={data.state}
          onChange={(e) => set('state', e.target.value)}
          options={STATES}
          placeholder="Select state"
          invalid={Boolean(errors.state)}
        />
      </FormField>

      <FormField
        label="Courts You Practise In"
        required
        error={errors.courts}
        hint="Where do you appear? Select all that apply."
        className="sm:col-span-2"
      >
        <ChipMultiSelect
          options={COURTS}
          value={data.courts || []}
          onChange={(next) => set('courts', next)}
        />
      </FormField>

      <FormField
        label="Cities You Work In"
        error={errors.practiceCities}
        hint="All the cities you take cases in (besides your base city)."
        className="sm:col-span-2"
      >
        <ChipMultiSelect
          options={CITY_NAMES}
          value={data.practiceCities || []}
          onChange={(next) => set('practiceCities', next)}
          max={8}
        />
      </FormField>

      <FormField
        label="Legal Services"
        required
        error={errors.services}
        hint="Select up to 4 services you practise."
        className="sm:col-span-2"
      >
        <ChipMultiSelect
          options={LEGAL_SERVICE_NAMES}
          value={data.services}
          onChange={onServicesChange}
          max={4}
        />
      </FormField>

      {servicesWithSubs.length > 0 && (
        <div className="sm:col-span-2 space-y-4 rounded-xl border border-ink/8 bg-muted/30 p-4">
          <p className="text-sm font-medium text-ink/80">
            Specific areas you handle{' '}
            <span className="font-normal text-ink/45">(optional — helps clients find you)</span>
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

      <FormField label="Languages" required error={errors.languages} className="sm:col-span-2">
        <ChipMultiSelect
          options={LANGUAGES}
          value={data.languages}
          onChange={(next) => set('languages', next)}
        />
      </FormField>
    </div>
  );
}
