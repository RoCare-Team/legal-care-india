import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * OfficeVisit — a client booking a physical, in-person consultation at a
 * lawyer's office, paid in full online through Razorpay when it is booked.
 *
 *   pending   → paid        (Razorpay confirmed the payment; the slot is taken)
 *   pending   → (abandoned) (checkout closed — the slot is never held)
 *   paid      → completed   (admin marks the visit done; the lawyer is credited)
 *   paid      → cancelled   (admin cancels; any refund is made from Razorpay)
 *
 * The office, the fee and both names are copied on at booking, so a lawyer
 * who later moves office or changes their fee does not rewrite a past visit.
 */
const OfficeVisitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    userPhone: { type: String, default: '' },

    advocateId: { type: Schema.Types.ObjectId, ref: 'Advocate', required: true, index: true },
    advocateName: { type: String, default: '' },
    legalCareId: { type: String, default: '' },

    office: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },

    // Office (IST) calendar date and slot start — 'YYYY-MM-DD' and 'HH:mm'.
    date: { type: String, required: true },
    time: { type: String, required: true },
    // What the client wants to discuss, so the lawyer can prepare.
    note: { type: String, default: '' },

    amount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['pending', 'paid', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },

    razorpayOrderId: { type: String, default: '', index: true },
    razorpayPaymentId: { type: String, default: '' },
    paidAt: { type: Date, default: null },

    // The lawyer's share, credited to their earnings wallet once — on completion.
    earningCredited: { type: Boolean, default: false },
    earning: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },

    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    adminNote: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

// One paid booking per lawyer per slot.
OfficeVisitSchema.index({ advocateId: 1, date: 1, time: 1, status: 1 });

export default mongoose.models.OfficeVisit || mongoose.model('OfficeVisit', OfficeVisitSchema);
