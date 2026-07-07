import { IndianRupee } from 'lucide-react';
import { FormField, Input, Textarea } from '@/components/ui';

/**
 * StepPractice — office details, fee and about (step 3 of registration).
 *
 * @param {object} props
 * @param {object} props.data
 * @param {(field:string,value:any)=>void} props.set
 * @param {Record<string,string>} props.errors
 */
export default function StepPractice({ data, set, errors }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField label="Office / Chamber Name" htmlFor="officeName" required error={errors.officeName} className="sm:col-span-2">
        <Input
          id="officeName"
          value={data.officeName}
          onChange={(e) => set('officeName', e.target.value)}
          placeholder="e.g. Sharma Legal Chambers"
          invalid={Boolean(errors.officeName)}
        />
      </FormField>

      <FormField label="Office Address" htmlFor="officeAddress" required error={errors.officeAddress} className="sm:col-span-2">
        <Textarea
          id="officeAddress"
          rows={2}
          value={data.officeAddress}
          onChange={(e) => set('officeAddress', e.target.value)}
          placeholder="Building, street, area, city, pincode"
          invalid={Boolean(errors.officeAddress)}
        />
      </FormField>

      <FormField label="Consultation Fee (₹)" htmlFor="fee" required error={errors.fee}>
        <Input
          id="fee"
          type="number"
          min="0"
          value={data.fee}
          onChange={(e) => set('fee', e.target.value)}
          placeholder="e.g. 1500"
          leftIcon={<IndianRupee className="h-4 w-4" />}
          invalid={Boolean(errors.fee)}
        />
      </FormField>

      <FormField label="Headline / Tagline" htmlFor="tagline" hint="One line clients see first.">
        <Input
          id="tagline"
          value={data.tagline}
          onChange={(e) => set('tagline', e.target.value)}
          placeholder="e.g. Trusted family & civil dispute expert"
        />
      </FormField>

      <FormField
        label="About You"
        htmlFor="about"
        required
        error={errors.about}
        hint="Describe your experience and approach (min 40 characters)."
        className="sm:col-span-2"
      >
        <Textarea
          id="about"
          rows={5}
          value={data.about}
          onChange={(e) => set('about', e.target.value)}
          placeholder="Tell clients about your practice, notable areas of expertise and how you help..."
          invalid={Boolean(errors.about)}
        />
      </FormField>
    </div>
  );
}
