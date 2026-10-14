import mongoose from 'mongoose';

/**
 * AppleTransaction — one App Store purchase made in the iOS app, claimed once.
 *
 * The unique index on `transactionId` is what makes a payment usable exactly
 * once: the iOS app re-sends an unfinished transaction on every launch, and
 * two of those can arrive together. Whichever creates the row first does the
 * grant; the other gets 503 (still processing) or 409 (already granted).
 *
 * `environment` is kept because App Review and TestFlight buy in Sandbox
 * against the live server — those must be granted, but never counted as
 * revenue.
 */
const AppleTransactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true },
    originalTransactionId: { type: String, default: '' },
    productId: { type: String, required: true },
    // A client for the document check, a lawyer for a plan.
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accountRole: { type: String, enum: ['user', 'advocate'], required: true },
    environment: { type: String, default: '' }, // 'Production' | 'Sandbox'
    purchaseDate: { type: Date, default: null },
    status: { type: String, enum: ['processing', 'granted', 'refunded'], default: 'processing' },
    // What it bought: the review it paid for, or the plan it granted.
    reviewId: { type: String, default: '' },
    planId: { type: String, default: '' },
    grantedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.AppleTransaction ||
  mongoose.model('AppleTransaction', AppleTransactionSchema);
