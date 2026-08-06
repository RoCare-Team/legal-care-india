/**
 * PIN code → district and state, from India Post's own directory.
 *
 * OpenStreetMap (which the rest of `lib/geocode` uses) can turn a PIN into
 * coordinates, but it is unreliable at naming the Indian district a PIN
 * belongs to — the thing a registration form actually wants. India Post
 * publishes the authoritative mapping, free and without a key, so a PIN is
 * resolved from the source that issues them.
 *
 * Server-side only: one place to hold the timeout, so a slow third party can
 * never hang a request of ours.
 */

const ENDPOINT = 'https://api.postalpincode.in/pincode';
/** The same directory, searched by post office name instead of by PIN. */
const ENDPOINT_BY_NAME = 'https://api.postalpincode.in/postoffice';

/** Long enough for a slow reply, short enough that a form still feels live. */
const TIMEOUT_MS = 6000;

/**
 * How well a post office names the place around it, lowest first.
 * A head office serves a city, a sub office a town, a branch office a hamlet.
 */
const OFFICE_RANK = { 'Head Post Office': 0, 'Sub Post Office': 1, 'Branch Post Office': 2 };

function officeRank(branchType) {
  return OFFICE_RANK[branchType] ?? 3;
}

/** The value that appears most often; ties go to the first one seen. */
function commonest(values) {
  const counts = new Map();
  for (const v of values) {
    if (v) counts.set(v, (counts.get(v) || 0) + 1);
  }
  let best = '';
  let top = 0;
  for (const [value, n] of counts) {
    if (n > top) {
      best = value;
      top = n;
    }
  }
  return best;
}

/** India Post returns districts in shouty case ("GURGAON") — title-case them. */
function titleCase(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * The other direction: a city and state → a PIN code for it.
 *
 * A city has many PINs — Mumbai has hundreds — so this is a sensible default,
 * not an answer. The head office is preferred because its PIN is the one the
 * city is generally known by, and the field stays editable for the advocate
 * who knows their own.
 *
 * @param {string} city
 * @param {string} state  used to reject same-named towns in other states
 * @returns {Promise<string>} the PIN, or '' when nothing matches
 */
export async function lookupCityPincode(city, state) {
  const names = (Array.isArray(city) ? city : [city])
    .map((n) => String(n || '').trim())
    .filter((n) => n.length >= 3);

  // Tried in turn: the directory knows "Bangalore" and not "Bengaluru", so the
  // caller hands us both and the first that answers wins.
  for (const name of names) {
    // eslint-disable-next-line no-await-in-loop
    const pin = await searchPincodeByName(name, state);
    if (pin) return pin;
  }
  return '';
}

/** One name, one request. See `lookupCityPincode` for why it is split out. */
async function searchPincodeByName(name, state) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${ENDPOINT_BY_NAME}/${encodeURIComponent(name)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return '';

    const entry = (await res.json())?.[0];
    if (!entry || entry.Status !== 'Success') return '';

    const offices = Array.isArray(entry.PostOffice) ? entry.PostOffice : [];
    // "Gurgaon" exists in more than one state; without this the form could be
    // handed a PIN from the wrong end of the country.
    const target = String(state || '').toLowerCase().replace(/[^a-z]/g, '');
    const inState = target
      ? offices.filter((o) => String(o.State || '').toLowerCase().replace(/[^a-z]/g, '') === target)
      : offices;

    const best = [...(inState.length ? inState : offices)].sort(
      (a, b) => officeRank(a.BranchType) - officeRank(b.BranchType)
    )[0];

    return /^[1-9][0-9]{5}$/.test(best?.Pincode || '') ? best.Pincode : '';
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve a six-digit PIN code.
 *
 * @param {string} code
 * @returns {Promise<{pincode:string, district:string, state:string, area:string}|null>}
 *   null when the PIN is unknown, malformed, or the service is unreachable —
 *   callers treat all three the same way: let the visitor type it themselves.
 */
export async function lookupPincode(code) {
  const pin = String(code || '').trim();
  if (!/^[1-9][0-9]{5}$/.test(pin)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${ENDPOINT}/${pin}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const payload = await res.json();
    // The API answers with a single-element array; "Error" means no such PIN.
    const entry = Array.isArray(payload) ? payload[0] : null;
    if (!entry || entry.Status !== 'Success') return null;

    const offices = Array.isArray(entry.PostOffice) ? entry.PostOffice : [];
    if (!offices.length) return null;

    // A PIN can cover a dozen post offices, and the list arrives alphabetically
    // — so the first one is whichever village starts with an "A". 122107 led
    // with "Akhera", a branch office nobody outside it has heard of, when the
    // town the PIN belongs to is Nuh.
    //
    // The office that best names the place is the highest-ranking one: a head
    // office serves a city, a sub office a town, a branch office a village.
    const best = [...offices].sort(
      (a, b) => officeRank(a.BranchType) - officeRank(b.BranchType)
    )[0];

    // District and state by majority, not from that one office — a PIN that
    // straddles a boundary should be filed under the side most of it is on.
    return {
      pincode: pin,
      district: titleCase(commonest(offices.map((o) => o.District))),
      state: titleCase(commonest(offices.map((o) => o.State))),
      // The nearest named locality, for a "Nuh · Gurgaon, Haryana" style hint.
      area: titleCase(best.Name),
    };
  } catch {
    // Aborted, offline, or malformed JSON — indistinguishable to the caller.
    return null;
  } finally {
    clearTimeout(timer);
  }
}
