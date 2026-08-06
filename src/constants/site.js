/**
 * Global, single-source-of-truth site configuration.
 * Consumed by metadata, layout, footer, and SEO helpers.
 */
export const SITE = {
  name: 'Justiceland',
  shortName: 'Justiceland',
  tagline: 'Find Verified Lawyers Across India',
  description:
    'Justiceland is a trusted lawyer directory platform to discover, compare and connect with verified lawyers across every city and legal service in India.',
  url: 'https://justiceland.online',
  locale: 'en_IN',
  language: 'en-IN',
  twitterHandle: '@legalcareindia',
  themeColor: '#1E3A5F',
  keywords: [
    'lawyer directory india',
    'find lawyer',
    'lawyers near me',
    'verified lawyers',
    'legal help india',
    'lawyer near me',
    'civil lawyer',
    'criminal lawyer',
    'family lawyer',
  ],
};

export const CONTACT = {
  /**
   * Where someone writes when something is wrong: a refund, a password, a
   * policy question, a consultation that misbehaved. This is the address on
   * the footer, the legal pages and the schema contact point, and the one
   * account emails are sent from — a reply to any of them reaches a human who
   * can act on it.
   */
  email: 'support@justiceland.online',
  /**
   * Where someone writes when nothing is wrong: careers, partnerships, press,
   * "what is this platform". Kept apart so a job application never lands in
   * the same queue as a client who cannot log in.
   */
  infoEmail: 'info@justiceland.online',
  // The support line. This drives the floating Call and WhatsApp buttons on
  // every public page, the contact page and the footer, so a wrong number here
  // is a wrong number sitewide.
  phone: '+91 70650 59942',
  // Digits only, with the country code and no '+' — the format wa.me expects.
  whatsapp: '917065059942',
  /**
   * The registered office, in the lines it should be read on.
   *
   * An array rather than one long string: a postal address has a shape, and
   * flattened into a single line it stops looking like somewhere you could
   * actually walk into. `addressText` joins it back up for the places that
   * genuinely need one string — schema.org, a `<meta>` tag, a maps query.
   */
  address: [
    'Head Office, Unit No. 831, 8th Floor',
    'JMD Megapolis, Sector 48',
    'Gurugram, Haryana 122018',
  ],
};

/** The office address as one line, for map links and anywhere a string is wanted. */
export const addressText = CONTACT.address.join(', ');

/** A Google Maps search for the office. */
export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;

export const SOCIAL = {
  twitter: 'https://twitter.com/legalcareindia',
  facebook: 'https://facebook.com/legalcareindia',
  linkedin: 'https://linkedin.com/company/legalcareindia',
  instagram: 'https://instagram.com/legalcareindia',
};
