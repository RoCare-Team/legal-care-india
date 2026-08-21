import mongoose from 'mongoose';

/**
 * User — a regular client account (not a lawyer).
 *
 * Users can sign up to get a lightweight account on Justiceland. For now
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
    // Razorpay identifiers for top-ups. `paymentId` is what makes crediting
    // idempotent: the browser callback and the webhook both report the same
    // payment, and whichever arrives second must not add the money twice.
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const UserSchema = new Schema(
  {
    // Identity is the mobile number now: an account is created the first time a
    // number passes OTP verification. Name, email and password are all things
    // an account may simply not have — there is no sign-up form left to demand
    // them, so requiring them here would make login itself impossible.
    name: { type: String, default: '', trim: true },

    // `sparse` matters: without it, every account created without an email
    // would count as the same `null` value and the unique index would reject
    // all but the first one.
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      default: undefined,
    },
    passwordHash: { type: String, default: undefined },

    // Password reset via OTP — same scheme as Advocate: only the SHA-256 hash
    // of the 6-digit code is stored, with an expiry, and `resetOtpAttempts`
    // guards against brute-forcing it.
    resetOtpHash: { type: String, default: null, select: false },
    resetOtpExpires: { type: Date, default: null, select: false },
    resetOtpAttempts: { type: Number, default: 0, select: false },

    // The 10-digit mobile number, stored bare (no +91, no spaces) so a lookup
    // at login is an exact match. This is the account's identity, so the
    // database enforces one account per number rather than trusting the login
    // route to check first — two requests arriving together would both pass
    // that check and create two accounts for the same person.
    //
    // `sparse` covers accounts that genuinely have no number; without it every
    // one of them would collide on the same missing value.
    phone: { type: String, unique: true, sparse: true, default: undefined },
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
