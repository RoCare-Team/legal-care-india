'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import RegisterStepper from './RegisterStepper';
import StepPersonal from './StepPersonal';
import StepProfessional from './StepProfessional';
import StepPractice from './StepPractice';
import StepConsultation from './StepConsultation';
import StepReview from './StepReview';
import RegisterSuccess from './RegisterSuccess';
import { validateStep, INITIAL_REGISTER_DATA } from '@/lib/registerValidation';
import { trackMetaEvent } from '@/utils/metaPixel';

const STEPS = ['Personal', 'Professional', 'Practice', 'Consultation', 'Review'];

const STEP_TITLES = [
  'Personal information',
  'Professional information',
  'Practice information',
  'Consultation & profile',
  'Review & confirm',
];

const STEP_SUBTITLES = [
  'Who you are, how to reach you, and where you practise from.',
  'Your Bar Council enrolment, standing and office.',
  'The courts you appear in and the work you take.',
  'What you charge, when you sit, and your write-up.',
  'Check everything reads correctly before you submit.',
];

const STEP_COMPONENTS = [
  StepPersonal,
  StepProfessional,
  StepPractice,
  StepConsultation,
  StepReview,
];

/**
 * RegisterWizard — the five-step advocate registration flow.
 *
 * On final submit it creates a real account via /api/auth/register and shows the
 * success screen; the advocate is already signed in at that point.
 *
 * The card is capped at 900px and the step's own controls are pinned to the
 * bottom of the viewport while scrolling. These steps are long — Practice alone
 * can run to sixty chips — and a Continue button that lives at the end of the
 * page means scrolling past everything twice: once to fill it, once to leave.
 */
export default function RegisterWizard({ cities }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(INITIAL_REGISTER_DATA);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [slug, setSlug] = useState('');
  // Problems a step spots for itself as they are typed — a taken email, a
  // mismatched password — as opposed to the ones `validateStep` finds on
  // Continue. Held here so Continue can refuse to step over them.
  const [blockers, setBlockers] = useState({});
  const topRef = useRef(null);

  // Moving between steps replaces the whole page of fields; without this the
  // visitor lands halfway down the next step with no idea it changed.
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const set = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submitRegistration = async () => {
    setSubmitting(true);
    setServerError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(payload.error || 'Registration failed. Please try again.');
        return;
      }
      setSlug(payload.advocate?.profilePath || payload.advocate?.slug || '');
      setSubmitted(true);
      // The account exists now. The success screen renders in place, so there
      // is no navigation racing the pixel's beacon here.
      trackMetaEvent('CompleteRegistration', {
        content_name: 'Lawyer account',
        status: 'wizard',
      });
    } catch {
      setServerError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Stable identity: the step reports its live problems from an effect, and a
  // fresh callback each render would restart that effect on every keystroke.
  const onBlockersChange = useCallback((next) => {
    setBlockers((prev) => {
      const same = Object.keys({ ...prev, ...next }).every((k) => prev[k] === next[k]);
      return same ? prev : next;
    });
  }, []);

  const goNext = () => {
    const live = Object.fromEntries(Object.entries(blockers).filter(([, v]) => v));
    const stepErrors = { ...validateStep(step, data), ...live };
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setErrors({});
    if (step < STEPS.length - 1) {
      setBlockers({});
      setStep((s) => s + 1);
    } else {
      submitRegistration();
    }
  };

  const goBack = () => {
    setErrors({});
    setBlockers({});
    setStep((s) => Math.max(0, s - 1));
  };

  const StepComponent = STEP_COMPONENTS[step];
  const isLast = step === STEPS.length - 1;

  if (submitted) {
    return (
      <div className="mx-auto max-w-[900px] rounded-3xl border border-ink/8 bg-surface p-6 shadow-card sm:p-10">
        <RegisterSuccess name={data.fullName} slug={slug} />
      </div>
    );
  }

  return (
    <div ref={topRef} className="mx-auto max-w-[900px] scroll-mt-24">
      <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-7">
        <RegisterStepper steps={STEPS} current={step} />

        {/* Step number, title and subtitle on one line each — the wizard used
            three stacked blocks here, which cost nearly 150px of height on
            every one of the five steps. */}
        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-ink/8 pb-3">
          <h2 className="font-display text-lg font-bold text-ink">{STEP_TITLES[step]}</h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Step {step + 1} / {STEPS.length}
          </p>
          <p className="w-full text-[13px] leading-snug text-ink/55">{STEP_SUBTITLES[step]}</p>
        </div>

        <form
          className="pt-5"
          onSubmit={(e) => {
            e.preventDefault();
            goNext();
          }}
        >
          <StepComponent
            data={data}
            set={set}
            errors={errors}
            cities={cities}
            onBlockersChange={onBlockersChange}
          />

          {serverError && (
            <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {serverError}
            </p>
          )}

          {/* Pinned to the foot of the screen while the step is being filled,
              and returning to the flow of the page at its end — so the controls
              are always a thumb away without floating over the last field. */}
          <div className="sticky bottom-0 z-20 -mx-5 mt-6 border-t border-ink/8 bg-surface/95 px-5 py-3 backdrop-blur-md sm:-mx-7 sm:px-7 sm:py-3.5">
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                disabled={step === 0 || submitting}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Previous
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                rightIcon={isLast ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              >
                {isLast ? (submitting ? 'Submitting…' : 'Submit Registration') : 'Continue'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
