import mongoose from 'mongoose';

/**
 * User — a regular client account (not a lawyer).
 *
 * Users can sign up to get a lightweight account on Legal Care India. For now
 * this is just identity + login credentials; richer features (saved lawyers,
 * reviews, enquiries) can hang off this model later.
 */
const { Schema } = mongoose;

/** A single wallet ledger entry (money added or spent). */
const WalletTxnSchema = new Schema(
  {
    type: { type: String, enum: ['credit', 'debit'], default: 'credit' },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '' },
    photo: { type: String, default: '' },
    city: { type: String, default: '' },
    // Privacy preference: when on, the user's name is hidden from lawyers
    // (they see "Anonymous"). Set once in the account, applied to every booking.
    anonymous: { type: Boolean, default: false },
    // Wallet: prepaid balance (in ₹) the user tops up themselves, plus a ledger.
    walletBalance: { type: Number, default: 0, min: 0 },
    walletTransactions: { type: [WalletTxnSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
