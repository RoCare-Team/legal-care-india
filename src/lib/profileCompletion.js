/**
 * What "finished" means for a lawyer's profile, in one place.
 *
 * Three things ask this question and they must not disagree: the dashboard
 * card showing a percentage, the guided setup that walks a lawyer through the
 * gaps, and the setup's own live counter as they type. If each decided for
 * itself, a lawyer could be told 60% on one screen and 75% on the next.
 *
 * The two callers hold the profile in different shapes — the dashboard reads
 * the stored record, the setup form holds a flat editable draft — so both are
 * flattened to one small shape first and every rule below is written against
 * that. Adding a field to the checklist means touching one list, not three.
 */

/**
 * The steps, in the order a lawyer should do them.
 *
 * Ordered by what a client actually searches and filters on, not by what is
 * easiest to fill in: practice areas decide whether this lawyer appears at all,
 * a photograph decides whether the profile is opened, and the office gallery
 * decides nothing but looks nice. A lawyer who gives up halfway has still done
 * the half that counts.
 *
 * "About" is last, against that ordering, for one reason: it is the only field
 * that can be written from the others. Asked first it is a blank box in front
 * of a busy advocate — the commonest place to abandon a profile. Asked last it
 * is a summary of answers already given, and can be drafted for them.
 *
 * `weight` is not here on purpose. Every item counts once — a percentage made
 * of items a lawyer cannot see the weighting of is a percentage they cannot
 * predict, and a progress bar that jumps 14% for a photograph and 3% for a
 * whole practice area reads as broken rather than as considered.
 */
export const PROFILE_STEPS = [
  {
    id: 'practice',
    title: 'Your practice',
    blurb:
      'The areas and matters you handle. This is what clients search on, so it is the one step worth doing first.',
    items: [
      { key: 'areas', label: 'Practice areas', done: (p) => p.areas > 0 },
      { key: 'matters', label: 'Matters you handle', done: (p) => p.matters > 0 },
      { key: 'courts', label: 'Courts you practise in', done: (p) => p.courts > 0 },
      { key: 'languages', label: 'Languages you consult in', done: (p) => p.languages > 0 },
    ],
  },
  {
    id: 'presence',
    title: 'How you appear',
    blurb:
      'Your photograph and the one line that sits under your name — the two things a client sees before deciding to read further. Profiles with a photo get opened far more often.',
    items: [
      { key: 'photo', label: 'Profile photograph', done: (p) => p.hasPhoto },
      { key: 'tagline', label: 'A one-line tagline', done: (p) => p.tagline },
    ],
  },
  {
    id: 'credentials',
    title: 'Your credentials',
    blurb:
      'Bar council number, years of practice and where you studied. These are what the verified badge is checked against.',
    items: [
      { key: 'barCouncil', label: 'Bar council number', done: (p) => p.barCouncil },
      { key: 'experience', label: 'Years of experience', done: (p) => p.experience > 0 },
      { key: 'education', label: 'Education', done: (p) => p.education > 0 },
    ],
  },
  {
    id: 'consultations',
    title: 'Consultations',
    blurb:
      'What you charge for a 10, 30 or 60 minute slot. Leave any of them blank and our standard price applies to that one.',
    items: [
      { key: 'slots', label: 'Your own slot prices', done: (p) => p.slotPrices > 0 },
    ],
  },
  {
    id: 'office',
    title: 'Where clients find you',
    blurb:
      'Your chamber address, when you are there, and photographs of the place. The photographs are optional, but they are what makes a profile feel real.',
    items: [
      { key: 'officeAddress', label: 'Office address', done: (p) => p.officeAddress },
      { key: 'timing', label: 'Office timings', done: (p) => p.timing > 0 },
      { key: 'gallery', label: 'Office photographs', done: (p) => p.gallery > 0 },
    ],
  },
  {
    id: 'about',
    title: 'About your practice',
    blurb:
      'The paragraph clients read before they call. Left until last on purpose — by now everything it needs is already on your profile, so we can draft it for you.',
    items: [
      { key: 'about', label: 'About your practice', done: (p) => p.about },
    ],
  },
];

/** Every item, flattened — the denominator of the percentage. */
export const ALL_ITEMS = PROFILE_STEPS.flatMap((s) => s.items);

const filled = (v) => Boolean(String(v ?? '').trim());
const count = (v) => (Array.isArray(v) ? v.length : 0);

/**
 * The stored record, flattened.
 *
 * Must be given the RAW document (see `getRawAdvocateById`), never the public
 * profile: that one invents an about paragraph, an office address, education
 * and a gallery for any profile without them, and a checklist reading it would
 * congratulate a lawyer who has entered nothing.
 */
export function fromRecord(a = {}) {
  return {
    hasPhoto: Boolean(a.hasPhoto || filled(a.photo)),
    about: filled(a.about),
    tagline: filled(a.tagline),
    areas: count(a.specializations),
    matters: count(a.subSpecializations),
    courts: count(a.courts),
    languages: count(a.languages),
    barCouncil: filled(a.barCouncilNumber),
    experience: Number(a.experience) || 0,
    education: count(a.education),
    slotPrices: Object.keys(a.slotPrices || {}).length,
    officeAddress: filled(a.office?.address),
    timing: count(a.timing),
    gallery: (a.gallery || []).filter((g) => g && g.url).length,
  };
}

/** The editable draft the profile form holds, flattened the same way. */
export function fromDraft(d = {}) {
  return {
    hasPhoto: filled(d.photo),
    about: filled(d.about),
    tagline: filled(d.tagline),
    areas: count(d.services),
    matters: count(d.subServices),
    courts: count(d.courts),
    languages: count(d.languages),
    barCouncil: filled(d.barCouncil),
    experience: Number(d.experience) || 0,
    education: count(d.education),
    // A blank entry means "use the platform price", which is not a decision
    // the lawyer has made, so it does not count as filled in.
    slotPrices: Object.values(d.slotPrices || {}).filter((v) => Number(v) > 0).length,
    officeAddress: filled(d.officeAddress),
    timing: count(d.timing),
    gallery: (d.gallery || []).filter((g) => g && g.url).length,
  };
}

/**
 * Score a flattened profile.
 *
 * @returns {{percent: number, done: number, total: number,
 *   steps: Array<{id, title, blurb, done, total, complete, items}>}}
 */
export function completionOf(flat) {
  const steps = PROFILE_STEPS.map((step) => {
    const items = step.items.map((item) => ({
      key: item.key,
      label: item.label,
      done: Boolean(item.done(flat)),
    }));
    const done = items.filter((i) => i.done).length;
    return { ...step, items, done, total: items.length, complete: done === items.length };
  });

  const done = steps.reduce((n, s) => n + s.done, 0);
  const total = ALL_ITEMS.length;
  return { percent: total ? Math.round((done / total) * 100) : 0, done, total, steps };
}
