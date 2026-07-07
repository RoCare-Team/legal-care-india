import { CheckCircle2, LayoutDashboard, UserRound } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * RegisterSuccess — confirmation shown after the wizard is submitted.
 *
 * @param {object} props
 * @param {string} props.name
 */
export default function RegisterSuccess({ name, slug }) {
  return (
    <div className="py-6 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-2xl font-semibold text-ink">
        Welcome{name ? `, ${name.replace(/^Adv\.?\s*/, '')}` : ''}!
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
        Your account is created and your profile is now live in the directory. Head to your
        dashboard any time to complete or update your details.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Button href="/dashboard" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
          Go to Dashboard
        </Button>
        {slug && (
          <Button href={`/advocates/${slug}`} variant="outline" leftIcon={<UserRound className="h-4 w-4" />}>
            View My Profile
          </Button>
        )}
      </div>
    </div>
  );
}
