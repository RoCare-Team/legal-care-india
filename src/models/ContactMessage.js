import mongoose from 'mongoose';

/**
 * ContactMessage — an enquiry sent from the public contact form.
 *
 * Separate from `Enquiry`, which is a client reaching one particular lawyer.
 * This is someone writing to Legal Care India itself — a support question, a
 * complaint, a partnership request — so it belongs to the admin panel rather
 * than to any lawyer's dashboard.
 *
 * `status` is how the panel keeps track of what has been dealt with:
 *   'new'      nobody has opened it yet
 *   'read'     seen, no reply needed or not yet sent
 *   'replied'  answered
 */
const { Schema } = mongoose;

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    subject: { type: String, default: '', trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },

    status: {
      type: String,
      enum: ['new', 'read', 'replied'],
      default: 'new',
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.ContactMessage ||
  mongoose.model('ContactMessage', ContactMessageSchema);
