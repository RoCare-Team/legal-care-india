import mongoose from 'mongoose';

/**
 * Advocate — the single document representing a registered advocate, their
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

const AdvocateSchema = new Schema(
  {
    // Auth
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // Identity
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
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

    specializations: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    consultationFee: { type: Number, default: 0 },

    office: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      area: { type: String, default: '' },
      pincode: { type: String, default: '' },
      mapQuery: { type: String, default: '' },
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

    // Ratings (populated by real reviews later)
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },

    // Visibility
    status: { type: String, enum: ['pending', 'published'], default: 'published' },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Advocate || mongoose.model('Advocate', AdvocateSchema);
