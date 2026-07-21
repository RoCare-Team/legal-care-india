import mongoose from 'mongoose';

/**
 * Activity — a log of a user's interactions with lawyers: booking a
 * consultation, or tapping Call / WhatsApp / Email on a profile. Powers the
 * "Your activity" history on the user's account page.
 */
const { Schema } = mongoose;

const ActivitySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    advocateId: { type: String, default: '' },
    advocateName: { type: String, default: '' },
    // Canonical profile path segment (`slug-lci-id`) to link back to the profile.
    advocateProfilePath: { type: String, default: '' },
    advocatePhone: { type: String, default: '' },
    advocateCity: { type: String, default: '' },
    type: {
      type: String,
      enum: ['booking', 'call', 'whatsapp', 'email'],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
