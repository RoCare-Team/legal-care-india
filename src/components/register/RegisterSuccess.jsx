import { Clock, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * RegisterSuccess — confirmation shown after the wizard is submitted.
 * The profile is created in a "pending" state and goes live only after an
 * admin approves it, so we set expectations about the review window.
 *
 * @param {object} props
 * @param {string} props.name
 */
export default function RegisterSuccess({ name }) {
  return (
    <div className="py-6 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-50 text-amber-600">
        <Clock className="h-9 w-9" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-2xl font-semibold text-ink">
        Thank you{name ? `, ${name.replace(/^Adv\.?\s*/, '')}` : ''}!
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
        Your registration has been received and is under review. Your profile will be
        added to the directory within <span className="font-semibold text-ink">24 hours</span>{' '}
        once our team verifies your details.
      </p>
      <p className="mx-auto mt-3 max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
        In the meantime, you can complete your profile from your dashboard — it&apos;ll go live
        automatically once approved.
      </p>
      <div className="mt-7 flex justify-center">
        <Button href="/dashboard" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
