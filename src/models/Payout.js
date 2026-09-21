import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Payout — a lawyer asking for their earnings to be sent to their bank.
 *
 * The amount leaves the earnings wallet the moment the request is made, so the
 * same money can never be requested twice or spent while it is on its way. An
 * admin then transfers it by hand and marks it paid with the bank reference
 * (UTR). A rejected or cancelled request puts the amount back in the wallet.
 *
 * The bank account is copied onto the request rather than referenced: a lawyer
 * who later removes or edits the account must not change where a past payout
 * says it went.
 *
 *   requested → paid       (admin transferred it)
 *   requested → rejected   (admin refused it; refunded)
 *   requested → cancelled  (lawyer withdrew it; refunded)
 */
const PayoutSchema = new Schema(
  {
    advocateId: { type: Schema.Types.ObjectId, ref: 'Advocate', required: true, index: true },
    advocateName: { type: String, default: '' },
    legalCareId: { type: String, default: '' },

    amount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['requested', 'paid', 'rejected', 'cancelled'],
      default: 'requested',
      index: true,
    },

    bank: {
      holderName: { type: String, default: '' },
      bankName: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      accountType: { type: String, default: 'savings' },
      accountLast4: { type: String, default: '' },
      // Sealed with lib/secretBox — only the admin view opens it.
      accountNumberEnc: { type: String, default: '' },
      panEnc: { type: String, default: '' },
    },

    // Bank transfer reference, entered when the admin marks it paid.
    utr: { type: String, default: '' },
    // Why it was rejected, or anything the admin wants the lawyer to see.
    adminNote: { type: String, default: '' },
    processedBy: { type: String, default: '' },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PayoutSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Payout || mongoose.model('Payout', PayoutSchema);
