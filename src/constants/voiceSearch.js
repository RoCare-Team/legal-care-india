/**
 * Voice legal search — the limits and the vocabulary, in one place.
 *
 * Someone speaks their problem, we transcribe it, an AI turns it into a
 * structured legal intent, and the directory's own search finds the lawyers.
 * The AI never sees a lawyer: it classifies the problem and stops there, which
 * is what keeps this cheap, private and impossible to hallucinate a lawyer
 * into.
 *
 * Everything a client and the server both have to agree on lives here — the
 * audio limits the recorder enforces and the API re-checks, the progress
 * wording, and the disclaimer.
 */

/**
 * The longest clip we accept.
 *
 * A minute is far more than anyone needs to say "my company has not paid me
 * for three months", and it is also what keeps the request inside the 4.5 MB
 * body limit a serverless host allows: Opus at the browser's default bitrate
 * is roughly 30 KB per second, so a minute is about 2 MB with room to spare.
 */
export const MAX_RECORDING_SECONDS = 60;

/** Below this there is nothing to transcribe — a stray tap, not a sentence. */
export const MIN_AUDIO_BYTES = 2_000;

/** Hard ceiling on the upload, checked again on the server. */
export const MAX_AUDIO_BYTES = 4 * 1024 * 1024;

/** The recorder warns from here, so a long story is not cut off silently. */
export const WARN_AT_SECONDS = 45;

/**
 * Container types a browser actually produces, plus the ones a mobile client
 * might send. Anything else is refused before it reaches a paid API.
 */
export const ACCEPTED_AUDIO_TYPES = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/x-m4a',
  'audio/aac',
  'audio/flac',
];

/** How many searches one person may run in an hour. */
export const RATE_LIMIT = {
  windowMs: 60 * 60 * 1000,
  signedOut: 6,
  signedIn: 25,
};

/** How many lawyers a search returns. */
export const MAX_RESULTS = 8;

/**
 * Shown wherever the result of this feature is: it routes a legal problem to
 * lawyers, and it must never read as legal advice in itself.
 */
export const DISCLAIMER =
  'This AI helps identify relevant legal services. It does not provide legal advice or representation, and it is not a substitute for a qualified lawyer.';

/**
 * What the visitor is told while they wait, keyed by the stage the client is
 * in. The wording is about their problem, not about our pipeline — nobody
 * waiting for a lawyer needs to know which API is being called.
 */
export const PROGRESS = {
  idle: '',
  permission: 'Waiting for microphone permission…',
  recording: 'Listening…',
  stopped: 'Got it.',
  uploading: 'Sending your recording…',
  transcribing: 'Writing down what you said…',
  analysing: 'Understanding your legal issue…',
  searching: 'Finding relevant lawyers…',
};

/** Urgency values the analysis may return, lowest first. */
export const URGENCY_LEVELS = ['low', 'medium', 'high'];

/**
 * How everyday words for a legal problem map onto the twelve practice areas
 * the directory actually stores (see data/categories).
 *
 * This is the join between what a model says and what a lawyer ticked on their
 * registration form. A model asked about unpaid salary will answer "Employment
 * Law" — a perfectly good answer that matches nothing here, because the area
 * on the form is called "Labour & Employment". Without this table the search
 * would filter on a name no lawyer has and return an empty list for a question
 * it understood perfectly.
 *
 * Keys are lowercase; values are exact category names from CATEGORIES.
 */
export const CATEGORY_ALIASES = {
  'employment law': 'Labour & Employment',
  employment: 'Labour & Employment',
  'labour law': 'Labour & Employment',
  labour: 'Labour & Employment',
  labor: 'Labour & Employment',
  'labor law': 'Labour & Employment',
  'industrial law': 'Labour & Employment',
  'service law': 'Labour & Employment',
  'wage dispute': 'Labour & Employment',

  'matrimonial law': 'Family Law',
  matrimonial: 'Family Law',
  divorce: 'Family Law',
  'divorce law': 'Family Law',
  'personal law': 'Family Law',
  family: 'Family Law',

  criminal: 'Criminal Law',
  'criminal defence': 'Criminal Law',
  'criminal defense': 'Criminal Law',
  'cyber law': 'Criminal Law',
  'cyber crime': 'Criminal Law',
  'cheque bounce': 'Criminal Law',

  civil: 'Civil Law',
  'civil litigation': 'Civil Law',
  'contract law': 'Civil Law',
  contracts: 'Civil Law',
  'tort law': 'Civil Law',
  defamation: 'Civil Law',
  'money recovery': 'Civil Law',

  property: 'Property Law',
  'land law': 'Property Law',
  'landlord tenant': 'Property Law',
  tenancy: 'Property Law',
  'rent dispute': 'Property Law',

  corporate: 'Corporate Law',
  'company law': 'Corporate Law',
  'commercial law': 'Corporate Law',
  business: 'Corporate Law',
  'business law': 'Corporate Law',
  startup: 'Corporate Law',
  insolvency: 'Corporate Law',
  bankruptcy: 'Corporate Law',
  arbitration: 'Corporate Law',

  tax: 'Tax Law',
  taxation: 'Tax Law',
  gst: 'Tax Law',
  'income tax': 'Tax Law',

  constitutional: 'Constitutional Law',
  'writ petition': 'Constitutional Law',
  'public interest litigation': 'Constitutional Law',
  pil: 'Constitutional Law',
  'human rights': 'Constitutional Law',

  consumer: 'Consumer Law',
  'consumer protection': 'Consumer Law',
  'medical negligence': 'Consumer Law',
  'insurance claim': 'Consumer Law',
  'banking dispute': 'Consumer Law',

  ip: 'Intellectual Property',
  'ip law': 'Intellectual Property',
  trademark: 'Intellectual Property',
  copyright: 'Intellectual Property',
  patent: 'Intellectual Property',

  rera: 'Real Estate / RERA',
  'real estate': 'Real Estate / RERA',
  'real estate law': 'Real Estate / RERA',
  builder: 'Real Estate / RERA',
  'housing society': 'Real Estate / RERA',

  immigration: 'Immigration Law',
  visa: 'Immigration Law',
  passport: 'Immigration Law',
  citizenship: 'Immigration Law',
};
