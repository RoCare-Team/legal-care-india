'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import RegisterStepper from './RegisterStepper';
import StepAccount from './StepAccount';
import StepProfessional from './StepProfessional';
import StepPractice from './StepPractice';
import StepReview from './StepReview';
import RegisterSuccess from './RegisterSuccess';
import { validateStep, INITIAL_REGISTER_DATA } from '@/lib/registerValidation';

const STEPS = ['Account', 'Professional', 'Practice', 'Review'];
const STEP_TITLES = [
  'Create your account',
  'Your professional details',
  'Practice & office details',
  'Review & confirm',
];

/**
 * RegisterWizard — orchestrates the 4-step advocate registration flow.
 * On final submit it creates a real account via /api/auth/register, then shows
 * the success screen (the advocate is already logged in at that point).
 */
export default function RegisterWizard({ cities }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(INITIAL_REGISTER_DATA);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [slug, setSlug] = useState('');

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
    } catch {
      setServerError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    const stepErrors = validateStep(step, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      submitRegistration();
    }
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  };

  const StepComponent = [StepAccount, StepProfessional, StepPractice, StepReview][step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-6 shadow-card sm:p-8">
      {submitted ? (
        <RegisterSuccess name={data.fullName} slug={slug} />
      ) : (
        <>
          <RegisterStepper steps={STEPS} current={step} />

          <div className="mt-8">
            <h2 className="font-display text-xl font-semibold text-ink">{STEP_TITLES[step]}</h2>
            <p className="mt-1 text-sm text-ink/55">
              Step {step + 1} of {STEPS.length}
            </p>

            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                goNext();
              }}
            >
              <StepComponent data={data} set={set} errors={errors} cities={cities} />

              {serverError && (
                <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {serverError}
                </p>
              )}

              <div className="mt-8 flex items-center justify-between gap-3 border-t border-ink/8 pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goBack}
                  disabled={step === 0 || submitting}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  rightIcon={isLast ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                >
                  {isLast ? (submitting ? 'Submitting…' : 'Submit Registration') : 'Continue'}
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
