import { FormField, Input, Select } from '@/components/ui';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import { LEGAL_SERVICE_NAMES, getSubServices } from '@/data/categories';
import { LANGUAGES, STATES } from '@/data/languages';
import { CITIES } from '@/data/cities';
import { COURTS } from '@/data/courts';

/**
 * StepProfessional — bar registration, experience, services & languages.
 *
 * @param {object} props
 * @param {object} props.data
 * @param {(field:string,value:any)=>void} props.set
 * @param {Record<string,string>} props.errors
 * @param {Array<{slug:string,name:string}>} [props.cities]  built-in + admin-added
 */
export default function StepProfessional({ data, set, errors, cities = CITIES }) {
  const subServices = data.subServices || [];

  // The cities the chosen state actually contains. Empty until a state is
  // picked, which is what keeps the city select closed rather than offering
  // every city in India next to a blank state.
  const citiesInState = data.state ? cities.filter((c) => c.state === data.state) : [];

  // The same list drives "Cities you work in", minus the base city — it is
  // already counted as one the lawyer serves, so offering it again invites a
  // duplicate. Every city in India was listed here before, which put Port Blair
  // and Silvassa in front of a lawyer who had just said Andhra Pradesh.
  const practiceCityOptions = citiesInState
    .map((c) => c.name)
    .filter((name) => name !== data.city);

  /**
   * Changing state clears anything tied to the old one — the base city and any
   * practice cities that do not belong to the new state. Left alone the profile
   * would claim cities in a state it is not in, and the stale chips would stay
   * selected while no longer being offered.
   */
  const onStateChange = (nextState) => {
    set('state', nextState);

    const inNextState = new Set(
      cities.filter((c) => c.state === nextState).map((c) => c.name)
    );

    if (data.city && !inNextState.has(data.city)) set('city', '');

    const kept = (data.practiceCities || []).filter((name) => inNextState.has(name));
    if (kept.length !== (data.practiceCities || []).length) set('practiceCities', kept);
  };

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

      {/* State before city, and the city list narrowed to it. Asked the other
          way round the two could disagree — a lawyer could pick Karaikal and
          leave the state blank, or set it to somewhere Karaikal is not. */}
      <FormField label="State" htmlFor="state" required error={errors.state}>
        <Select
          id="state"
          value={data.state}
          onChange={(e) => onStateChange(e.target.value)}
          options={STATES}
          placeholder="Select state"
          invalid={Boolean(errors.state)}
        />
      </FormField>

      <FormField
        label="City"
        htmlFor="city"
        required
        error={errors.city}
        hint={data.state ? undefined : 'Choose your state first.'}
      >
        <Select
          id="city"
          value={data.city}
          onChange={(e) => set('city', e.target.value)}
          placeholder="Select city"
          disabled={!data.state}
          invalid={Boolean(errors.city)}
        >
          <option value="">
            {data.state ? 'Select city' : 'Select state first'}
          </option>
          {citiesInState.map((c) => (
            <option key={c.slug} value={c.name}>{c.name}</option>
          ))}
        </Select>
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
        hint={
          data.state
            ? `Other cities in ${data.state} you take cases in, besides your base city.`
            : 'Choose your state first.'
        }
        className="sm:col-span-2"
      >
        <ChipMultiSelect
          options={practiceCityOptions}
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
