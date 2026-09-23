/**
 * Timezone options for the "Usually Online" picker.
 *
 * India first, since every lawyer on this platform practises from there today
 * — then a short list of other hubs a lawyer might actually be in, then every
 * IANA zone the running browser or Node knows, alphabetically, so the picker
 * is never missing a real one. `Intl.supportedValuesOf` is what both Chrome
 * and this project's Node version already use elsewhere; where it is not
 * available (an old browser) the list falls back to just the short one rather
 * than an empty picker.
 */
export const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Colombo',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
  'UTC',
];

/** The canonical name `Intl` resolves a zone to — 'Asia/Kolkata' normalises to
 * 'Asia/Calcutta', for instance. Used only to avoid listing the same real
 * zone twice, once under each name; the picker still shows and saves the
 * friendlier alias from COMMON_TIMEZONES, since `Intl` accepts it exactly the
 * same as the canonical form everywhere else it is used. */
function canonicalOf(zone) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: zone }).resolvedOptions().timeZone;
  } catch {
    return zone;
  }
}

/** "Asia/Kolkata" -> "GMT+5:30", for right now — offsets don't move often
 * enough, and never for a name in a picker, to need to be exact per-date. */
function offsetLabel(zone) {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName');
    return part?.value || '';
  } catch {
    return '';
  }
}

/** "Asia/Kolkata" -> "India Standard Time" — for showing one saved zone back,
 * on the public profile. Falls back to the offset when a zone has no common
 * name (most of the ocean/UTC-offset ids don't). */
export function zoneLabel(zone) {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'long' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName');
    return part?.value || offsetLabel(zone);
  } catch {
    return zone;
  }
}

/** @returns {Array<{value: string, label: string}>} common zones first, then
 *  the rest alphabetically — each labelled with its current UTC offset. */
export function timezoneOptions() {
  const all = typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : COMMON_TIMEZONES;
  // Excluded by canonical name, not by string match — otherwise India's own
  // zone would appear twice: once as 'Asia/Kolkata' from the list below, and
  // again as 'Asia/Calcutta' from `all`, both pointing at the same real zone.
  const coveredByCommon = new Set(COMMON_TIMEZONES.map(canonicalOf));
  const rest = all.filter((z) => !coveredByCommon.has(z)).sort();

  return [...COMMON_TIMEZONES, ...rest].map((zone) => ({
    value: zone,
    label: `${zone.replace(/_/g, ' ')} (${offsetLabel(zone)})`,
  }));
}
