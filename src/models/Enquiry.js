import mongoose from 'mongoose';

/**
 * Enquiry — a consultation request a signed-in user sends to a specific
 * advocate via the "" form on the advocate's profile.
 * It shows up in that advocate's dashboard under Enquiries.
 *
 * `advocateId` is the advocate's MongoDB _id (as a string) so the dashboard
 * can list enquiries for the logged-in advocate directly.
 */
const { Schema } = mongoose;

const EnquirySchema = new Schema(
  {
    // Which advocate this enquiry is for.
    advocateId: { type: String, required: true, index: true },
    advocateLegalCareId: { type: String, default: '' },
    advocateName: { type: String, default: '' },

    // Who sent it (the logged-in user, if available).
    userId: { type: String, default: '' },

    // Enquiry details entered in the form.
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true },
    phone: { type: String, required: true, trim: true },
    preferredDate: { type: String, default: '', trim: true },
    message: { type: String, required: true, trim: true },

    // Advocate-side status. 'new' = advocate hasn't responded yet.
    status: {
      type: String,
      enum: ['new', 'pending', 'confirmed', 'declined'],
      default: 'new',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema);
