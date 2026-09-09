import { useEffect, useState } from 'react';
import {
  Scale, Languages as LangIcon, Gavel, MapPin, Sparkles, Lock, ArrowUpRight,
} from 'lucide-react';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import { activePlan, getPlan, nextPlanFor } from '@/constants/membershipPlans';

/**
 * What a lawyer just bought, said in terms of what they can now do.
 *
 * Shown only on the return from a successful purchase, which is the one moment
 * it is news. A wider limit is invisible — the chips simply stop refusing —
 * so without this the lawyer would have to go back and try the thing that
 * failed in order to learn that it now works.
 *
 * Read from `window.location` rather than `useSearchParams` on purpose: the
 * hook would drag a Suspense requirement into a form that has no other reason
 * to be suspended, and this banner is decoration on a page that must render
 * with or without it.
 */
function UpgradedBanner() {
  const [planId, setPlanId] = useState('');

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('upgraded');
    if (id) setPlanId(id);
  }, []);

  if (!planId) return null;
  const plan = getPlan(planId);
  if (plan.monthly === 0) return null;

  const unlimited = plan.areas === null;
  return (
    <div className="mb-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-emerald-900">
          You are on {plan.name} now.
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-emerald-900/85">
          {unlimited
            ? 'You can add as many practice areas, matters and cities as you actually handle. Pick them below and save.'
            : `You can add up to ${plan.areas} practice areas, ${plan.matters} matters and ${plan.cities} cities. Pick them below and save.`}
        </p>
      </div>
    </div>
  );
}

/**
 * The answer to a chip that would not tick.
 *
 * It appears because the lawyer just tried to add something, so it names the
 * thing they tried to add and the plan that would hold it — not a generic
 * "upgrade for more". The link carries them back to this exact section after
 * they pay — the plans open over this page, and the limit lifts under them.
 *
 * @param {object} props
 * @param {string} props.blocked   what they tried to add
 * @param {object} props.plan      the plan they are on
 * @param {string|null} props.upgradeTo  cheapest plan that would fit, or null
 * @param {string} props.noun      'practice area', 'matter', 'city'
 */
function UpgradePrompt({ blocked, plan, upgradeTo, noun, onDismiss, onUpgrade }) {
  if (!blocked) return null;
  const next = upgradeTo ? getPlan(upgradeTo) : null;

  return (
    <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900">
            “{blocked}” needs a bigger plan.
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-amber-900/85">
            {plan.name} covers {plan[noun === 'city' ? 'cities' : noun === 'matter' ? 'matters' : 'areas']}{' '}
            {noun}
            {plan[noun === 'city' ? 'cities' : noun === 'matter' ? 'matters' : 'areas'] === 1 ? '' : 's'}
            , and you have used them all.{' '}
            {next
              ? `${next.name} covers ${next.areas === null ? 'as many as you handle' : `${next[noun === 'city' ? 'cities' : noun === 'matter' ? 'matters' : 'areas']}`}.`
              : 'Remove one first to add this.'}
          </p>

          {next && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Opens over this form rather than navigating to the plans
                  page. The lawyer is mid-edit with unsaved chips on screen;
                  leaving would cost them both their place and their work. */}
              <button
                type="button"
                onClick={onUpgrade}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-amber-700"
              >
                See plans
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-amber-900/70 transition-colors hover:bg-amber-100 hover:text-amber-900"
              >
                Not now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * How much of the plan's allowance is spent, and the way to buy more.
 *
 * The upgrade link appears only once the allowance is actually full. Offering
 * it beside an empty selection is an advertisement; offering it at the moment
 * a chip refuses to tick is an answer to the question the lawyer just asked.
 */
function PlanAllowance({ used, limit, noun, plural, planName, onUpgrade }) {
  const word = (n) => (n === 1 ? noun : plural || `${noun}s`);

  if (limit === null) {
    return (
      <p className="mt-2 text-[12.5px] text-ink/45">
        {used} {word(used)} listed — your {planName} plan has no limit.
      </p>
    );
  }

  const full = used >= limit;
  return (
    <p className={`mt-2 text-[12.5px] ${full ? 'text-amber-700' : 'text-ink/45'}`}>
      {used} of {limit} {word(limit)} used on your {planName} plan.
      {full && (
        <>
          {' '}
          {/* Opens the plans over this page. Navigating away would drop the
              lawyer on a dashboard with their unsaved selection gone. */}
          <button
            type="button"
            onClick={onUpgrade}
            className="font-semibold text-primary underline"
          >
            Upgrade to add more
          </button>
        </>
      )}
    </p>
  );
}
import { LEGAL_SERVICE_NAMES, getSubServices } from '@/data/categories';
import { LANGUAGES } from '@/data/languages';
import { COURTS } from '@/data/courts';
import { CITIES } from '@/data/cities';
import DashboardSection from '../DashboardSection';
import SectionAbout from './SectionAbout';
import PlanUpgradeModal from '../PlanUpgradeModal';

/**
 * SectionAboutServices — about text, legal services and languages.
 *
 * `cities` comes from the server page and already merges the built-in list with
 * admin-added cities; it falls back to the built-ins so the section still works
 * anywhere the prop isn't threaded through.
 */
export default function SectionAboutServices({ data, set, cities = CITIES, showAbout = true }) {
  const cityNames = cities.map((c) => c.name);
  const subServices = data.subServices || [];

  // What the lawyer last tried to add and could not, per section. Held here
  // rather than inside the chip group because the prompt belongs under the
  // group, not inside the row of chips.
  const [blocked, setBlocked] = useState({ areas: '', matters: '', cities: '' });
  const block = (key) => (option) => setBlocked((b) => ({ ...b, [key]: option }));
  const unblock = (key) => () => setBlocked((b) => ({ ...b, [key]: '' }));

  // Which cap opened the plans, so the modal can name what was refused and
  // point at the plan that would hold it.
  const [upgradeFor, setUpgradeFor] = useState('');
  const openPlans = (key) => () => setUpgradeFor(key);

  /**
   * A plan was bought without leaving this form.
   *
   * The caps are read from `data` through `activePlan`, so writing the new
   * plan into the draft is what actually lifts them — the chip that refused a
   * second ago starts working on the next render. The membership itself was
   * already granted server-side by /api/membership/verify; this is only the
   * copy the form is looking at.
   */
  const onUpgraded = (result) => {
    set('planId', result.planId);
    set('planExpiresAt', result.expiresAt || null);
    setUpgradeFor('');
    setBlocked({ areas: '', matters: '', cities: '' });
  };

  const onServicesChange = (nextServices) => {
    set('services', nextServices);
    const allowed = new Set(nextServices.flatMap((s) => getSubServices(s)));
    const pruned = subServices.filter((s) => allowed.has(s));
    if (pruned.length !== subServices.length) set('subServices', pruned);
  };

  // The plan this lawyer is actually on — a lapsed membership is Starter, so
  // the limits tighten the moment it lapses rather than when a job notices.
  const plan = activePlan(data);
  const areaCap = plan.areas;
  const matterCap = plan.matters;

  const onSubChange = (options, nextForCategory) => {
    const others = subServices.filter((s) => !options.includes(s));
    // The cap counts every area together, and each group only knows its own —
    // so what this group may add is whatever the others have left.
    const room = matterCap === null ? Infinity : matterCap - others.length;
    set('subServices', [...others, ...nextForCategory.slice(0, Math.max(0, room))]);
  };

  const mattersLeft =
    matterCap === null ? Infinity : Math.max(0, matterCap - subServices.length);

  // The lawyer's own city is where they are, not a city they added, so it does
  // not count against the allowance — the server applies the same rule.
  const base = String(data.city || '').trim().toLowerCase();
  const otherCities = (data.practiceCities || []).filter(
    (c) => String(c).trim().toLowerCase() !== base
  );
  // The chip list still contains the base city, so its cap has to allow for it.
  const cityCap =
    plan.cities === null
      ? null
      : plan.cities + ((data.practiceCities || []).length - otherCities.length);

  const servicesWithSubs = (data.services || []).filter((s) => getSubServices(s).length > 0);

  return (
    <>
      {/* The full editor shows everything on one page, so About belongs here.
          The guided setup asks for it on its own step at the end — by then it
          can be drafted from the rest — and passes showAbout={false}. */}
      {showAbout && <SectionAbout data={data} set={set} />}

      <UpgradedBanner />

      <DashboardSection
        id="services"
        title="Legal Services"
        description="The services you practise, then the specific matters under each. How many you may list depends on your plan."
        icon={Scale}
      >
        <ChipMultiSelect
          options={LEGAL_SERVICE_NAMES}
          value={data.services}
          onChange={(v) => { onServicesChange(v); unblock('areas')(); }}
          max={areaCap ?? undefined}
          onBlocked={block('areas')}
        />
        <PlanAllowance
          used={(data.services || []).length}
          limit={areaCap}
          noun="practice area"
          planName={plan.name}
          onUpgrade={openPlans('areas')}
        />
        <UpgradePrompt
          blocked={blocked.areas}
          plan={plan}
          upgradeTo={nextPlanFor(plan, { areas: (data.services || []).length + 1 })}
          noun="practice area"
          onDismiss={unblock('areas')}
          onUpgrade={openPlans('areas')}
        />

        {servicesWithSubs.length > 0 && (
          <div className="mt-5 space-y-4 rounded-xl border border-ink/8 bg-muted/30 p-4">
            <p className="text-sm font-medium text-ink/80">
              Specific matters you handle{' '}
              <span className="font-normal text-ink/45">(optional)</span>
            </p>
            <PlanAllowance
              used={subServices.length}
              limit={matterCap}
              noun="matter"
              planName={plan.name}
              onUpgrade={openPlans('matters')}
            />
            <UpgradePrompt
              blocked={blocked.matters}
              plan={plan}
              upgradeTo={nextPlanFor(plan, { matters: subServices.length + 1 })}
              noun="matter"
              onDismiss={unblock('matters')}
              onUpgrade={openPlans('matters')}
            />
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
                    onChange={(next) => { onSubChange(options, next); unblock('matters')(); }}
                    max={
                      matterCap === null ? undefined : selected.length + mattersLeft
                    }
                    onBlocked={block('matters')}
                  />
                </div>
              );
            })}
          </div>
        )}
      </DashboardSection>

      <DashboardSection id="courts" title="Courts" description="The courts you practise in — clients can filter lawyers by court." icon={Gavel}>
        <ChipMultiSelect
          options={COURTS}
          searchLabel="Search courts…"
          value={data.courts || []}
          onChange={(v) => set('courts', v)}
        />
      </DashboardSection>

      <DashboardSection id="cities" title="Cities You Work In" description="Every city you take cases in (besides your base city). Clients searching those cities will find you." icon={MapPin}>
        <ChipMultiSelect
          options={cityNames}
          searchLabel="Search cities…"
          value={data.practiceCities || []}
          onChange={(v) => { set('practiceCities', v); unblock('cities')(); }}
          max={cityCap === null ? undefined : cityCap}
          onBlocked={block('cities')}
        />
        <PlanAllowance
          used={otherCities.length}
          limit={plan.cities}
          noun="other city"
          plural="other cities"
          planName={plan.name}
          onUpgrade={openPlans('cities')}
        />
        <UpgradePrompt
          blocked={blocked.cities}
          plan={plan}
          upgradeTo={nextPlanFor(plan, { cities: otherCities.length + 1 })}
          noun="city"
          onDismiss={unblock('cities')}
          onUpgrade={openPlans('cities')}
        />
      </DashboardSection>

      <PlanUpgradeModal
        open={Boolean(upgradeFor)}
        onClose={() => setUpgradeFor('')}
        currentPlan={plan}
        blocked={blocked[upgradeFor] || ''}
        suggest={
          upgradeFor === 'areas'
            ? nextPlanFor(plan, { areas: (data.services || []).length + 1 })
            : upgradeFor === 'matters'
              ? nextPlanFor(plan, { matters: subServices.length + 1 })
              : upgradeFor === 'cities'
                ? nextPlanFor(plan, { cities: otherCities.length + 1 })
                : null
        }
        onUpgraded={onUpgraded}
      />

      <DashboardSection id="languages" title="Languages" description="Languages you can consult in." icon={LangIcon}>
        <ChipMultiSelect
          options={LANGUAGES}
          searchLabel="Search languages…"
          value={data.languages}
          onChange={(v) => set('languages', v)}
        />
      </DashboardSection>
    </>
  );
}
