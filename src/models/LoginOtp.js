import mongoose from 'mongoose';

/**
 * LoginOtp — throttling state for mobile login, one row per phone number.
 *
 * Deliberately holds no code. The SMS gateway generates and checks the OTP, so
 * storing a copy here would add a second place for it to leak without making
 * any login more or less valid.
 *
 * What it does hold is the part the gateway does not enforce: how recently a
 * code went out, how many have gone out this hour, and how many wrong guesses
 * have come back. The verify endpoint is unauthenticated, so without an attempt
 * limit of our own a 4-digit code is ten thousand guesses away from anyone.
 */
const { Schema } = mongoose;

const LoginOtpSchema = new Schema(
  {
    /** Normalised 10-digit Indian mobile number. */
    phone: { type: String, required: true, unique: true, index: true },

    /** When the last code went out — drives the resend cooldown. */
    lastSentAt: { type: Date, default: Date.now },

    /** Codes sent in the current hour, and when that hour started. */
    sendCount: { type: Number, default: 1 },
    windowStartedAt: { type: Date, default: Date.now },

    /** Wrong guesses since the last code was sent. */
    attempts: { type: Number, default: 0 },

    /** When this row may be discarded. */
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Mongo drops the row once `expiresAt` passes, so the collection cleans itself
// up rather than growing one row per number that ever tried to log in.
LoginOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.LoginOtp || mongoose.model('LoginOtp', LoginOtpSchema);
