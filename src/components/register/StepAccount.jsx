import { User, Mail, Phone, Lock } from 'lucide-react';
import { FormField, Input } from '@/components/ui';

/**
 * StepAccount — basic account credentials (step 1 of registration).
 *
 * @param {object} props
 * @param {object} props.data
 * @param {(field:string,value:any)=>void} props.set
 * @param {Record<string,string>} props.errors
 */
export default function StepAccount({ data, set, errors }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField label="Full Name" htmlFor="fullName" required error={errors.fullName} className="sm:col-span-2">
        <Input
          id="fullName"
          value={data.fullName}
          onChange={(e) => set('fullName', e.target.value)}
          placeholder="Adv. Your Name"
          leftIcon={<User className="h-4 w-4" />}
          invalid={Boolean(errors.fullName)}
        />
      </FormField>

      <FormField label="Email Address" htmlFor="email" required error={errors.email}>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="you@example.com"
          leftIcon={<Mail className="h-4 w-4" />}
          invalid={Boolean(errors.email)}
        />
      </FormField>

      <FormField label="Mobile Number" htmlFor="phone" required error={errors.phone}>
        <Input
          id="phone"
          type="tel"
          value={data.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+91 98765 43210"
          leftIcon={<Phone className="h-4 w-4" />}
          invalid={Boolean(errors.phone)}
        />
      </FormField>

      <FormField label="Password" htmlFor="password" required error={errors.password} hint="Minimum 8 characters.">
        <Input
          id="password"
          type="password"
          value={data.password}
          onChange={(e) => set('password', e.target.value)}
          placeholder="Create a password"
          leftIcon={<Lock className="h-4 w-4" />}
          invalid={Boolean(errors.password)}
        />
      </FormField>

      <FormField label="Confirm Password" htmlFor="confirm" required error={errors.confirm}>
        <Input
          id="confirm"
          type="password"
          value={data.confirm}
          onChange={(e) => set('confirm', e.target.value)}
          placeholder="Re-enter password"
          leftIcon={<Lock className="h-4 w-4" />}
          invalid={Boolean(errors.confirm)}
        />
      </FormField>
    </div>
  );
}
