/**
 * Advocates are stored in MongoDB and created only through real registration —
 * there is no seed/mock data. These empty exports remain so any lingering
 * import resolves safely; use the async helpers in `src/lib/advocates.js`
 * (getAllAdvocates, getAdvocateBySlug, …) to read real records.
 *
 * @typedef {Object} AdvocateRecord
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 */

/** @type {AdvocateRecord[]} */
export const ADVOCATES = [];
