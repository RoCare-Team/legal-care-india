import mongoose from 'mongoose';

const { Schema } = mongoose;

/** A single chat message within a consultation session. */
const MessageSchema = new Schema(
  {
    from: { type: String, enum: ['user', 'advocate'], required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

/**
 * Consultation — a paid, time-boxed chat session a user books with a lawyer.
 *
 * Lifecycle:
 *   pending   → user booked, waiting for the lawyer to accept
 *   active    → lawyer accepted; wallet charged; chat open until `endsAt`
 *   ended     → time up or ended early
 *   rejected  → lawyer declined (no charge)
 *   cancelled → user backed out while still pending (no charge)
 */
const ConsultationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, default: '' },
    advocateId: { type: Schema.Types.ObjectId, ref: 'Advocate', required: true, index: true },
    advocateName: { type: String, default: '' },

    minutes: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['pending', 'active', 'ended', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },

    messages: { type: [MessageSchema], default: [] },

    startedAt: { type: Date, default: null }, // when the lawyer accepted
    endsAt: { type: Date, default: null },    // startedAt + minutes (planned end)
    endedAt: { type: Date, default: null },   // when it actually ended

    // Either side can clear the row from their own list. The record itself
    // stays, so hiding it on one side never affects the other.
    hiddenForAdvocate: { type: Boolean, default: false },
    hiddenForUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Consultation ||
  mongoose.model('Consultation', ConsultationSchema);
