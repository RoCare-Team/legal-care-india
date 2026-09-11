/**
 * The part of a lawyer's profile a card, the directory's filters and its sort
 * actually read — and nothing else.
 *
 * The directory filters and sorts in the browser, so every lawyer it lists has
 * to travel inside the page. It used to travel whole: About text, education,
 * certificates, awards, generated FAQs, office timings, social links, every
 * review. At 391 lawyers that was 2.3 MB of page for cards that show a name, a
 * photo, three rates and four tags, and a phone downloaded and parsed all of it
 * before the first card could be pressed.
 *
 * What stays is decided by what reads it:
 *  - the cards: name, photo, place, experience, rating, designation,
 *    specialisations, languages, the published contact phone and WhatsApp, the
 *    rates and slot prices, and the ids a profile link is built from;
 *  - the filters (lib/advocateSearch and AdvocateListing): tagline and courts
 *    for the search box, sub-specialisations for a matter, practice cities for
 *    a city, the consultation fee for In-Person, and the office's coordinates
 *    for a distance;
 *  - the sort: plan id and expiry, so paid lawyers still lead.
 *
 * The old fixed-plan arrays are only kept for a channel the lawyer has no
 * per-minute rate on, because that is the only case `advocateRate` reads them.
 *
 * Use it where a list is handed to a client component. Server-side readers
 * that render a whole profile, or the JSON-LD, keep the full record.
 *
 * @param {object} a  a public profile from getAllAdvocates
 * @returns {object}
 */
export function toCardAdvocate(a) {
  const plans = (list) =>
    (list || []).map((p) => ({ minutes: p?.minutes, price: p?.price }));
  const location = a.office?.location;

  return {
    _id: a._id,
    legalCareId: a.legalCareId,
    slug: a.slug,
    profilePath: a.profilePath,

    name: a.name,
    photo: a.photo,
    city: a.city,
    state: a.state,
    experience: a.experience,
    rating: a.rating,
    reviews: a.reviews,
    verified: a.verified,
    designation: a.designation,
    tagline: a.tagline,

    specializations: a.specializations || [],
    subSpecializations: a.subSpecializations || [],
    languages: a.languages || [],
    courts: a.courts || [],
    practiceCities: a.practiceCities || [],

    consultationFee: a.consultationFee || 0,
    chatRate: a.chatRate || 0,
    audioRate: a.audioRate || 0,
    videoRate: a.videoRate || 0,
    ...(a.chatRate ? {} : { consultationPlans: plans(a.consultationPlans) }),
    ...(a.audioRate ? {} : { audioPlans: plans(a.audioPlans) }),
    ...(a.videoRate ? {} : { videoPlans: plans(a.videoPlans) }),
    slotPrices: a.slotPrices,

    planId: a.planId,
    planExpiresAt: a.planExpiresAt,

    contact: { phone: a.contact?.phone || '', whatsapp: a.contact?.whatsapp || '' },
    ...(location && typeof location.lat === 'number' && typeof location.lng === 'number'
      ? { office: { location: { lat: location.lat, lng: location.lng } } }
      : {}),
  };
}
