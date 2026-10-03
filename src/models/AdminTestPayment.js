import mongoose from 'mongoose';

/**
 * AdminTestPayment — a ₹1 charge an admin made from /admin/payments to prove
 * the gateway works end to end with the keys currently saved.
 *
 * Kept apart from wallets and orders on purpose: it is real money, so it has
 * to show in the payments ledger, but it belongs to no client and must never
 * turn into wallet balance or an order someone is owed.
 */
const { Schema } = mongoose;

const AdminTestPaymentSchema = new Schema(
  {
    // Unique: the browser callback and the webhook both record it, and
    // whichever lands second must be a no-op.
    razorpayPaymentId: { type: String, required: true, unique: true },
    razorpayOrderId: { type: String, default: '' },
    amount: { type: Number, default: 0, min: 0 },
    mode: { type: String, default: '' },
    adminEmail: { type: String, default: '' },
    // 'verify' or 'webhook' — which path got there first. When the webhook
    // never shows up as a source, the webhook is not wired up.
    recordedBy: { type: String, default: 'verify' },
    webhookSeenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.AdminTestPayment ||
  mongoose.model('AdminTestPayment', AdminTestPaymentSchema);
