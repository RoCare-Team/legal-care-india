import { advocateRate } from '@/constants/callRates';

/**
 * The stored lawyer record, flattened into what the profile form edits.
 *
 * Shared by the full editor and the guided setup so the two cannot disagree
 * about what a field is called or what it starts as — they post to the same
 * endpoint, and a field named differently in one of them is a field that
 * silently stops saving.
 *
 * Takes the RAW record (`getRawAdvocateById`), never the public profile. The
 * public one fills in an about paragraph, an office address, education and a
 * gallery for any profile that has none; seeding an editor from it would show
 * a lawyer invented text as though they had written it, and the first Save
 * would make it theirs.
 *
 * @param {object} a raw advocate document
 */
export function toEditableSnapshot(a) {
  return {
    fullName: a.name || '',
    // Not editable — carried so the services section knows how many areas and
    // matters this lawyer is entitled to. The PUT route picks the fields it
    // writes by name, so sending it back changes nothing.
    planId: a.planId || 'free',
    planExpiresAt: a.planExpiresAt || null,
    // Keyed by slot minutes; blank entries mean the platform default applies.
    slotPrices: a.slotPrices ? { ...a.slotPrices } : {},
    photo: a.photo || '',
    coverImage: a.coverImage || '',
    gallery: (a.gallery || []).filter((g) => g && g.url),
    tagline: a.tagline || '',
    city: a.city || '',
    state: a.state || '',
    about: a.about || '',
    services: a.specializations || [],
    subServices: a.subSpecializations || [],
    languages: a.languages || [],
    courts: a.courts || [],
    practiceCities: a.practiceCities || [],
    barCouncil: a.barCouncilNumber || '',
    experience: String(a.experience || ''),
    cases: String(a.metrics?.cases || ''),

    casesWon: String(a.metrics?.casesWon || ''),
    clients: String(a.metrics?.clients || ''),
    successRate: String(a.metrics?.successRate || ''),
    education: a.education || [],
    officeName: a.office?.name || '',
    officeAddress: a.office?.address || '',
    pincode: a.office?.pincode || '',
    timing: a.timing || [],
    phone: a.contact?.phone || a.phone || '',
    whatsapp: a.contact?.whatsapp || '',
    email: a.contact?.email || a.email || '',
    fee: String(a.consultationFee || ''),
    // Per-minute rate per live channel, as form strings. Lawyers who still
    // have the old fixed plans and no rate of their own see the converted
    // equivalent, so the form opens with a sensible number rather than blank.
    chatRate: String(advocateRate(a, 'chat') || ''),
    audioRate: String(advocateRate(a, 'audio') || ''),
    videoRate: String(advocateRate(a, 'video') || ''),
    certificates: a.certificates || [],
    awards: a.awards || [],
    social: {
      linkedin: a.social?.linkedin || '',
      website: a.social?.website || '',
      facebook: a.social?.facebook || '',
      twitter: a.social?.twitter || '',
    },
  };
}
