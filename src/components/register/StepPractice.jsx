import { IndianRupee, Clock, MessagesSquare } from 'lucide-react';
import { FormField, Input, Textarea } from '@/components/ui';
import RepeatableList from '@/components/dashboard/RepeatableList';
import { formatDuration } from '@/constants/consultationPlans';

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

      {/* Live-chat booking plans — the advocate sets duration + price per plan. */}
      <div className="sm:col-span-2">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <MessagesSquare className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Live Chat Consultation Plans</p>
            <p className="text-xs text-ink/50">
              Set your own plans — you choose the duration and price. Clients book exactly these. Optional.
            </p>
          </div>
        </div>
        {errors.consultationPlans && (
          <p className="mb-2 text-xs text-red-600">{errors.consultationPlans}</p>
        )}
        <RepeatableList
          items={data.consultationPlans || []}
          onChange={(v) => set('consultationPlans', v)}
          template={{ minutes: '', price: '' }}
          addLabel="Add plan"
          renderRow={(item, update) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Duration (minutes)"
                hint={item.minutes ? formatDuration(item.minutes) : 'e.g. 15, 30, 60'}
              >
                <Input
                  type="number"
                  min="5"
                  max="480"
                  placeholder="15"
                  value={item.minutes}
                  onChange={(e) => update({ minutes: e.target.value })}
                  leftIcon={<Clock className="h-4 w-4" />}
                />
              </FormField>
              <FormField label="Price (₹)" hint="What you charge for this plan.">
                <Input
                  type="number"
                  min="1"
                  placeholder="500"
                  value={item.price}
                  onChange={(e) => update({ price: e.target.value })}
                  leftIcon={<IndianRupee className="h-4 w-4" />}
                />
              </FormField>
            </div>
          )}
        />
      </div>

      <FormField label="Headline / Tagline" htmlFor="tagline" hint="One line clients see first." className="sm:col-span-2">
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
