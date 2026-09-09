'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, Loader2, Eye, Scale, UserRound,
  GraduationCap, Timer, Building2, X, PartyPopper, Sparkles, Clock, AlignLeft, Pencil,
} from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { fromDraft, completionOf } from '@/lib/profileCompletion';
import SectionAboutServices from './sections/SectionAboutServices';
import SectionBasic from './sections/SectionBasic';
import SectionExperienceEducation from './sections/SectionExperienceEducation';
import SectionContactFees from './sections/SectionContactFees';
import SectionOfficeTiming from './sections/SectionOfficeTiming';
import SectionGallerySocial from './sections/SectionGallerySocial';
import SectionAbout from './sections/SectionAbout';

/**
 * The guided way through a profile, one step at a time.
 *
 * Registration now ends after a name, an email and a city, which leaves a
 * lawyer on a dashboard with a mostly empty profile and a long form somewhere
 * behind a link. Most will not go and find it. So this walks them: five steps,
 * a progress ring that moves as they type, and one thing being asked for at a
 * time instead of forty.
 *
 * The steps are not new screens — they are the same section components the
 * profile editor uses, shown a group at a time. There is exactly one place
 * where a practice area is edited, and it behaves identically here, upgrade
 * prompt and all. A second implementation would have drifted from the first
 * within a month.
 *
 * Every step saves before it advances, so a lawyer who closes the tab at step
 * three keeps steps one and two. Nothing is held to the end.
 *
 * @param {object} props
 * @param {object} props.initial      the same flat snapshot the editor takes
 * @param {Array} props.cities
 * @param {string} props.previewHref
 * @param {string} [props.advocateName]
 */
const STEP_META = {
  practice: { icon: Scale, Section: SectionAboutServices },
  presence: { icon: UserRound, Section: SectionBasic },
  credentials: { icon: GraduationCap, Section: SectionExperienceEducation },
  consultations: { icon: Timer, Section: SectionContactFees },
  office: { icon: Building2, Section: SectionOfficeTiming, extra: SectionGallerySocial },
  about: { icon: AlignLeft, Section: SectionAbout },
};

export default function ProfileSetupStepper({
  initial, cities, previewHref, advocateName, justJoined = false, status,
}) {
  const [data, setData] = useState(initial);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState(false);
  // A lawyer who has filled everything in is shown where their profile stands,
  // not another form. `editing` is how they get back to the form from there —
  // being finished is a state to leave, not a door that locks.
  const [editing, setEditing] = useState(false);

  // Recomputed on every keystroke, which is the point: the ring has to move
  // while they are filling something in, or it reads as a static decoration.
  const progress = useMemo(() => completionOf(fromDraft(data)), [data]);
  const step = progress.steps[index];
  const meta = STEP_META[step?.id] || {};
  const Section = meta.Section;
  const Extra = meta.extra;
  const isLast = index === progress.steps.length - 1;

  const set = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  /** Persist what is filled in so far. Returns whether it stuck. */
  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not save. Please try again.');
        return false;
      }
      return true;
    } catch {
      setError('Network error. Check your connection and try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const go = (i) => {
    setIndex(i);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = async () => {
    if (!(await save())) return;
    if (isLast) {
      setFinished(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    go(index + 1);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <SetupHeader percent={progress.percent} name={advocateName} />

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        {/* Complete is complete, however they got there — by finishing the last
            step or by filling the last gap on step two. Either way the useful
            screen is the one that says where the profile now stands, and the
            form is a click away rather than in the way. */}
        {(finished || progress.percent === 100) && !editing ? (
          <FinishedPanel
            progress={progress}
            previewHref={previewHref}
            status={status}
            onReview={() => { setFinished(false); setEditing(true); go(0); }}
          />
        ) : (
          <>
          {justJoined && progress.percent < 100 && (
            <NewHere name={advocateName} status={status} />
          )}

          <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
            {/* The rail. On a phone it collapses to a horizontal strip above
                the form; on a laptop it stands beside it so the lawyer can see
                the whole road, not just the next turn. */}
            {/* `min-w-0` is load-bearing. Without it this grid column cannot
                shrink below the rail's min-content width — five 9.5rem steps
                laid out in a row — so on a phone the whole grid widened past
                the viewport and the page scrolled sideways instead of the
                rail scrolling inside it. */}
            <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <ProgressCard progress={progress} />
              <StepRail steps={progress.steps} index={index} onPick={go} />
            </div>

            <div className="min-w-0">
              <StepPanel step={step} index={index} total={progress.steps.length}>
                {Section && (
                  <Section
                    data={data}
                    set={set}
                    cities={cities}
                    // Step 1 is practice areas and matters; About is its own
                    // step at the end, where it can be drafted from them.
                    {...(step.id === 'practice' ? { showAbout: false } : {})}
                    // Name and city were taken on the step that created the
                    // account. Asking again here is the same question twice.
                    {...(step.id === 'presence' ? { identity: false } : {})}
                    // Likewise the phone, which the login code already proved,
                    // and the email. This step is about what a slot costs.
                    {...(step.id === 'consultations' ? { contact: false } : {})}
                  />
                )}
                {Extra && <Extra data={data} set={set} />}
              </StepPanel>

              {error && (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}

              <Footer
                index={index}
                isLast={isLast}
                saving={saving}
                onBack={() => go(index - 1)}
                onNext={next}
              />
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The first thing a lawyer sees on arriving from registration.
 *
 * It does NOT say the profile is live, because it is not: it appears in the
 * directory once it is filled in and once an admin has approved it, and
 * neither of those has happened. Telling a lawyer they are listed and then
 * having them search for themselves and find nothing is the fastest way to
 * lose them — and it is a claim we cannot keep, since the decision is not
 * ours to make on their behalf.
 */
function NewHere({ name, status }) {
  const first = String(name || '').replace(/^Adv\.?\s*/i, '').split(' ')[0] || 'there';
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-primary/15 bg-primary/[0.05] px-4 py-3">
      <p className="text-[13.5px] font-semibold text-ink">
        Welcome, {first} — your account is ready.
      </p>
      <p className="text-[12.5px] text-ink/55">
        Six short steps, each saved as you go.
      </p>
      {status === 'pending' && (
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11.5px] font-semibold text-amber-800">
          <Clock className="h-3 w-3" aria-hidden="true" />
          Listed after review
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ header */

/**
 * The page's own chrome, since the site's is hidden here.
 *
 * Carries the one thing a lawyer might legitimately want mid-setup — a way
 * out — and nothing else. The percentage rides along so it stays visible once
 * the progress card has scrolled away on a phone.
 */
function SetupHeader({ percent, name }) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/8 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Logo className="h-8" />

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-ink/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percent === 100 ? 'bg-emerald-500' : 'bg-primary'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[13px] font-semibold tabular-nums text-ink/60">{percent}%</span>
          </div>

          <Link
            href="/dashboard"
            title={name ? `Leave setup, ${name.split(' ')[0]}` : 'Leave setup'}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Finish later</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- progress */

/** The number, as a ring. Big, because it is the reason to keep going. */
function ProgressCard({ progress }) {
  const { percent, done, total } = progress;
  const complete = percent === 100;

  // A 44-radius circle: circumference ≈ 276.5. The dash offset is the part of
  // the ring left unpainted, so it counts down as the percentage goes up.
  const R = 44;
  const C = 2 * Math.PI * R;

  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)]">
      <div className="flex items-center gap-4 lg:flex-col lg:text-center">
        <div className="relative h-[88px] w-[88px] shrink-0">
          <svg viewBox="0 0 104 104" className="h-full w-full -rotate-90">
            <circle
              cx="52" cy="52" r={R} fill="none" strokeWidth="8"
              stroke="currentColor" className="text-ink/10"
            />
            <circle
              cx="52" cy="52" r={R} fill="none" strokeWidth="8" strokeLinecap="round"
              stroke="currentColor"
              className={complete ? 'text-emerald-500' : 'text-primary'}
              strokeDasharray={C}
              strokeDashoffset={C - (C * percent) / 100}
              style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)' }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span
              className={`font-display text-2xl font-bold tabular-nums ${
                complete ? 'text-emerald-600' : 'text-ink'
              }`}
            >
              {percent}%
            </span>
          </div>
        </div>

        <div className="min-w-0 lg:mt-1">
          <p className="font-display text-[15px] font-semibold text-ink">
            {complete ? 'Profile complete' : 'Complete your profile'}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink/55">
            {complete
              ? 'Filled in — now with our team for review.'
              : `${done} of ${total} details done. A profile is reviewed for the directory once it is complete.`}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- rail */

/** Five steps, each showing its own state and how much of it is left. */
function StepRail({ steps, index, onPick }) {
  return (
    <ol className="mt-4 flex gap-2 overflow-x-auto pb-2 lg:mt-3 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
      {steps.map((s, i) => {
        const Icon = STEP_META[s.id]?.icon || Check;
        const current = i === index;
        return (
          <li key={s.id} className="min-w-[9.5rem] flex-1 lg:min-w-0 lg:flex-none">
            <button
              type="button"
              onClick={() => onPick(i)}
              aria-current={current ? 'step' : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                current
                  ? 'border-primary/30 bg-primary/[0.06] shadow-[inset_2px_0_0_0_#1E3A5F]'
                  : 'border-transparent hover:bg-ink/[0.04]'
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${
                  s.complete
                    ? 'bg-emerald-500 text-white'
                    : current
                      ? 'bg-primary text-white'
                      : 'bg-ink/[0.07] text-ink/40 group-hover:bg-ink/10'
                }`}
              >
                {s.complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[13px] font-semibold ${
                    current ? 'text-ink' : s.complete ? 'text-ink/55' : 'text-ink/70'
                  }`}
                >
                  {s.title}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1 w-10 overflow-hidden rounded-full bg-ink/10">
                    <span
                      className={`block h-full rounded-full transition-all duration-500 ${
                        s.complete ? 'bg-emerald-500' : 'bg-primary/60'
                      }`}
                      style={{ width: `${(s.done / s.total) * 100}%` }}
                    />
                  </span>
                  <span className="text-[11px] tabular-nums text-ink/40">
                    {s.done}/{s.total}
                  </span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------- panel */

/** The step itself: what it is, what it still wants, and the fields. */
function StepPanel({ step, index, total, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)]">
      {/* Kept deliberately short. Everything in this header is orientation,
          and orientation that pushes the first field below the fold costs
          more than it explains — the step number and title sit on one line,
          and the blurb is one line under them. */}
      <div className="border-b border-ink/8 bg-gradient-to-b from-ink/[0.015] to-transparent px-5 py-3.5 sm:px-7 sm:py-4">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <h1 className="font-display text-[19px] font-semibold leading-tight text-ink sm:text-xl">
            {step.title}
          </h1>
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary/60">
            Step {index + 1} of {total}
          </span>
        </div>
        <p className="mt-1 max-w-2xl text-[12.5px] leading-snug text-ink/55">
          {step.blurb}
        </p>

        {/* What this step still wants, said as a list rather than left for the
            lawyer to work out from which boxes look empty. */}
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {step.items.map((item) => (
            <li
              key={item.key}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium ${
                item.done
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-ink/12 bg-surface text-ink/45'
              }`}
            >
              {item.done ? (
                <Check className="h-3 w-3" aria-hidden="true" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-ink/25" aria-hidden="true" />
              )}
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ footer */

function Footer({ index, isLast, saving, onBack, onNext }) {
  return (
    <div className="sticky bottom-4 z-20 mt-5 flex items-center justify-between gap-3 rounded-2xl border border-ink/8 bg-surface/95 p-3 shadow-[0_-2px_8px_rgba(16,24,40,0.04),0_12px_32px_-12px_rgba(16,24,40,0.2)] backdrop-blur-md sm:p-3.5">
      <button
        type="button"
        onClick={onBack}
        disabled={index === 0 || saving}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink disabled:invisible"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Not "skip" — nothing is lost by moving on, because this saves first.
            "Later" is the honest word for it. */}
        {!isLast && (
          <button
            type="button"
            onClick={onNext}
            disabled={saving}
            className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink/45 transition-colors hover:text-ink/75 disabled:opacity-50"
          >
            Do this later
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Saving…' : isLast ? 'Save & finish' : 'Save & continue'}
          {!saving && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- the end */

/**
 * Where the profile stands, once there is nothing left to fill in.
 *
 * Three different things can be true here and they are not interchangeable, so
 * the panel says which one it is rather than a single cheerful message:
 *
 *   complete + pending    — done, and waiting on us. This is the common case
 *                           and the one a lawyer most needs explained, because
 *                           from their side nothing appears to be happening.
 *   complete + published  — actually live, and they can go and look.
 *   incomplete            — they pressed finish with gaps left. Saying "done"
 *                           here would be a lie they discover later.
 */
function FinishedPanel({ progress, previewHref, status, onReview }) {
  const complete = progress.percent === 100;
  const live = status === 'published';
  const missing = progress.steps.flatMap((s) => s.items).filter((i) => !i.done);

  const tone = !complete
    ? { ring: 'bg-primary/10 text-primary', wash: 'from-primary/[0.06]' }
    : live
      ? { ring: 'bg-emerald-100 text-emerald-600', wash: 'from-emerald-50' }
      : { ring: 'bg-amber-100 text-amber-600', wash: 'from-amber-50' };

  const Icon = !complete ? Sparkles : live ? PartyPopper : Clock;

  return (
    <div className="mx-auto max-w-xl">
      <div className="overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(16,24,40,0.16)]">
        <div className={`bg-gradient-to-b ${tone.wash} to-transparent px-6 py-8 text-center sm:px-10`}>
          <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${tone.ring}`}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>

          <h1 className="mt-4 font-display text-[26px] font-semibold leading-tight text-ink">
            {!complete
              ? 'Saved — you are almost there.'
              : live
                ? 'Your profile is live.'
                : 'Your profile is under review.'}
          </h1>

          <p className="mx-auto mt-2.5 max-w-md text-[14px] leading-relaxed text-ink/60">
            {!complete
              ? `Your profile is ${progress.percent}% complete. Everything you entered is already saved — it goes for review once the rest is filled in.`
              : live
                ? 'It is in the directory and clients can find you. Come back here any time your practice changes.'
                : 'Everything is filled in and it is with our team now. It appears in the directory as soon as it is approved — usually within a day. Nothing more is needed from you.'}
          </p>

          {complete && !live && (
            <div className="mx-auto mt-5 flex max-w-sm items-center gap-2.5 text-left">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500">
                <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              </span>
              <span className="flex-1 text-[12.5px] leading-snug text-ink/55">
                All {progress.total} details filled in
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11.5px] font-semibold text-amber-800">
                Awaiting approval
              </span>
            </div>
          )}

          {!complete && (
            <>
              <div className="mx-auto mt-5 h-2 w-full max-w-xs overflow-hidden rounded-full bg-ink/8">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <ul className="mt-4 flex flex-wrap justify-center gap-2">
                {missing.map((i) => (
                  <li
                    key={i.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[12px] font-medium text-amber-800"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                    {i.label}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2.5 border-t border-ink/8 px-6 py-5 sm:flex-row sm:justify-center sm:px-10">
          {!complete ? (
            <button
              type="button"
              onClick={onReview}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Finish the rest
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <Link
              href="/dashboard?welcome=1"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Go to dashboard
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}

          {live && (
            <Link
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/12 px-5 py-3 text-sm font-semibold text-ink/75 transition-colors hover:border-ink/25 hover:text-ink"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              View my profile
            </Link>
          )}

          {complete && (
            <button
              type="button"
              onClick={onReview}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit my profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
