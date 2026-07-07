import { FormField, Input, Select } from '@/components/ui';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import { LEGAL_SERVICE_NAMES } from '@/data/categories';
import { LANGUAGES, STATES } from '@/data/languages';
import { CITIES } from '@/data/cities';

/**
 * StepProfessional — bar registration, experience, services & languages.
 *
 * @param {object} props
 * @param {object} props.data
 * @param {(field:string,value:any)=>void} props.set
 * @param {Record<string,string>} props.errors
 */
export default function StepProfessional({ data, set, errors }) {
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
        label="Legal Services"
        required
        error={errors.services}
        hint="Select up to 4 services you practise."
        className="sm:col-span-2"
      >
        <ChipMultiSelect
          options={LEGAL_SERVICE_NAMES}
          value={data.services}
          onChange={(next) => set('services', next)}
          max={4}
        />
      </FormField>

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
