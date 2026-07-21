import mongoose from 'mongoose';

/**
 * Enquiry — a consultation request a signed-in user sends to a specific
 * lawyer via the "" form on the lawyer's profile.
 * It shows up in that lawyer's dashboard under Enquiries.
 *
 * `advocateId` is the lawyer's MongoDB _id (as a string) so the dashboard
 * can list enquiries for the logged-in lawyer directly.
 */
const { Schema } = mongoose;

const EnquirySchema = new Schema(
  {
    // Which lawyer this enquiry is for.
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

    // Lawyer-side status. 'new' = lawyer hasn't responded yet.
    status: {
      type: String,
      enum: ['new', 'pending', 'confirmed', 'declined'],
      default: 'new',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema);
