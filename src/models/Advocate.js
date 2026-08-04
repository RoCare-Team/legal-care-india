import mongoose from 'mongoose';

/**
 * Advocate — the single document representing a registered lawyer, their
 * login credentials and their full public profile.
 *
 * `status` controls public visibility:
 *   - 'pending'   : registered, not yet shown publicly
 *   - 'published' : profile complete, visible in the directory
 * `verified` adds the trust badge (reserved for manual/admin verification).
 */
const { Schema } = mongoose;

const EducationSchema = new Schema(
  { degree: String, institute: String, year: String },
  { _id: false }
);
const CredentialSchema = new Schema(
  { title: String, issuer: String, org: String, year: String },
  { _id: false }
);
const TimingSchema = new Schema(
  { day: String, hours: String, open: { type: Boolean, default: true } },
  { _id: false }
);
const GallerySchema = new Schema({ label: String, url: String }, { _id: false });
const ReviewSchema = new Schema(
  {
    author: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const AdvocateSchema = new Schema(
  {
    // Auth
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // Password reset via OTP (SHA-256 hash of the 6-digit code + expiry).
    // `resetOtpAttempts` guards against brute-forcing the code.
    resetOtpHash: { type: String, default: null, select: false },
    resetOtpExpires: { type: Date, default: null, select: false },
    resetOtpAttempts: { type: Number, default: 0, select: false },

    // Identity
    name: { type: String, required: true, trim: true },
    // Permanent, unique public ID — the stable key behind every profile URL.
    legalCareId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    // SEO slug — no longer unique (the legalCareId disambiguates), so two
    // lawyers with the same name can both be "manoj-sharma".
    slug: { type: String, required: true, index: true },
    phone: { type: String, required: true },

    // Profile basics
    photo: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    experience: { type: Number, default: 0 },
    barCouncilNumber: { type: String, default: '' },
    tagline: { type: String, default: '' },
    about: { type: String, default: '' },

    // Personal details collected at registration. All optional — a lawyer is
    // not blocked from listing for want of a date of birth, and nothing here is
    // shown publicly unless a later change chooses to.
    gender: {
      type: String,
      enum: ['', 'Male', 'Female', 'Other', 'Prefer not to say'],
      default: '',
    },
    dob: { type: Date, default: null },
    // The lawyer's own residential/correspondence address, distinct from
    // `office.address` below, which is where clients are seen.
    address: { type: String, default: '' },
    pincode: { type: String, default: '' },

    // Enrolment details. `barCouncilNumber` above is the number itself; these
    // say which Bar Council issued it and when.
    barCouncilState: { type: String, default: '' },
    enrollmentDate: { type: Date, default: null },

    // How the lawyer describes their standing and where they work from.
    designation: { type: String, default: '' },
    chamberName: { type: String, default: '' },
    // 'Independent' | 'Law Firm' | 'Chamber' | 'Corporate / In-house' — kept as
    // a plain string rather than an enum so the option list can grow without a
    // migration.
    practiceMode: { type: String, default: '' },

    specializations: { type: [String], default: [] },
    subSpecializations: { type: [String], default: [] },
    languages: { type: [String], default: [] },

    // Courts the lawyer practises in (e.g. High Court, District Court).
    courts: { type: [String], default: [] },
    // Every city the lawyer serves. `city` above is their primary/base city;
    // this is the full list shown on the profile ("Practises in ...").
    practiceCities: { type: [String], default: [] },

    consultationFee: { type: Number, default: 0 },

    // ── Per-minute consultation rates ────────────────────────────────────
    // What the lawyer charges for each minute of a live session, set by them
    // and billed on the minutes actually used. 0 ⇒ they don't offer that
    // channel at all.
    //
    // These replace the fixed { minutes, price } plan lists below, which are
    // kept only so documents saved before the change still price correctly —
    // `advocateRate()` converts them on read. Nothing writes them any more.
    chatRate: { type: Number, default: 0, min: 0 },
    audioRate: { type: Number, default: 0, min: 0 },
    videoRate: { type: Number, default: 0, min: 0 },

    // Live-chat consultation plans the lawyer defines themselves — both the
    // duration and the price. Empty ⇒ they don't offer live chat.
    consultationPlans: {
      type: [
        new Schema(
          {
            minutes: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 1 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    // Video-call plans — priced separately from live chat, since a video
    // consultation costs the lawyer more of their attention. Empty ⇒ no video.
    videoPlans: {
      type: [
        new Schema(
          {
            minutes: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 1 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    // Audio-call plans — the lawyer's own rates for a voice consultation,
    // priced separately again. Empty ⇒ they don't take audio calls.
    audioPlans: {
      type: [
        new Schema(
          {
            minutes: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 1 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    office: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      area: { type: String, default: '' },
      pincode: { type: String, default: '' },
      mapQuery: { type: String, default: '' },
      // Geocoded office coordinates (from the address/pincode via OpenStreetMap).
      // Powers the "lawyers near me" distance filter. null ⇒ not yet located.
      location: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    // A second place clients are seen, for advocates who also practise from
    // home. Not geocoded — `office` remains the address "near me" searches
    // rank on; this is shown on the profile as an additional location.
    residence: {
      practises: { type: Boolean, default: false },
      address: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    timing: { type: [TimingSchema], default: [] },

    contact: {
      phone: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    social: {
      linkedin: { type: String, default: '' },
      website: { type: String, default: '' },
      facebook: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },

    education: { type: [EducationSchema], default: [] },
    certificates: { type: [CredentialSchema], default: [] },
    awards: { type: [CredentialSchema], default: [] },
    gallery: { type: [GallerySchema], default: [] },

    // Ratings — derived from reviewsList whenever a review is added.
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    reviewsList: { type: [ReviewSchema], default: [] },

    // Practice highlights shown on the profile (entered by the lawyer).
    metrics: {
      cases: { type: Number, default: 0 },
      clients: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
    },

    // Presence — bumped by the lawyer's call listener while they have the
    // site open. Recent `lastSeenAt` ⇒ available to take live consultations.
    lastSeenAt: { type: Date, default: null },

    // Manual availability switch the lawyer flips in their dashboard. When
    // off (the default) they show as "Offline" everywhere and can't be booked,
    // regardless of whether they have the site open.
    available: { type: Boolean, default: false },

    // Earnings wallet — credited when a paid consultation connects.
    walletBalance: { type: Number, default: 0, min: 0 },
    walletTransactions: {
      type: [
        new Schema(
          {
            type: { type: String, enum: ['credit', 'debit'], default: 'credit' },
            amount: { type: Number, required: true, min: 0 },
            note: { type: String, default: '' },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: true }
        ),
      ],
      default: [],
    },

    // Visibility
    status: { type: String, enum: ['pending', 'published'], default: 'published' },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Advocate || mongoose.model('Advocate', AdvocateSchema);
