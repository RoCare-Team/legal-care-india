/**
 * Cities Indians call by two names.
 *
 * The directory has a page for "Gurugram"; the person searching says
 * "Gurgaon"; and the lawyer typed whichever of the two they think of their own
 * office as being in. All three have to find each other — on voice search and
 * on every city page — or a perfectly good lawyer in Gurgaon is invisible on
 * the Gurugram page.
 */
export const CITY_ALIASES = [
  ['gurugram', 'gurgaon'],
  ['bengaluru', 'bangalore'],
  ['mumbai', 'bombay'],
  ['kolkata', 'calcutta'],
  ['chennai', 'madras'],
  ['pune', 'poona'],
  ['mysuru', 'mysore'],
  ['vadodara', 'baroda'],
  ['thiruvananthapuram', 'trivandrum'],
  ['kochi', 'cochin'],
  ['puducherry', 'pondicherry'],
  ['prayagraj', 'allahabad'],
  ['varanasi', 'banaras', 'benares'],
  ['shimla', 'simla'],
  ['guwahati', 'gauhati'],
  ['indore', 'indhore'],
  ['noida', 'gautam buddha nagar'],
  ['navi mumbai', 'new bombay'],
];

/** Every name one city is known by, lowercase. */
export function aliasesOf(name) {
  const want = String(name || '').trim().toLowerCase();
  if (!want) return [];
  const row = CITY_ALIASES.find((names) => names.includes(want));
  return row ? [...row] : [want];
}

/** Do two city names mean the same place? */
export function sameCity(a, b) {
  const left = String(a || '').trim().toLowerCase();
  return Boolean(left) && aliasesOf(b).includes(left);
}
