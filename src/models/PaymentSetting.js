import mongoose from 'mongoose';

/**
 * PaymentSetting — the payment gateway credentials, editable from /admin.
 *
 * One document per provider (`provider: 'razorpay'`), so the keys can be
 * rotated from the panel without a redeploy or an .env edit.
 *
 * The two secret fields are stored ENCRYPTED (see lib/secretBox). A database
 * dump on its own is therefore not enough to charge cards or forge a payment —
 * the encryption key lives in the environment, not in Mongo.
 */
const { Schema } = mongoose;

const PaymentSettingSchema = new Schema(
  {
    provider: { type: String, required: true, unique: true, default: 'razorpay' },

    // Public by design — the browser checkout needs it.
    keyId: { type: String, default: '' },

    // Ciphertext, never the raw value.
    keySecretEnc: { type: String, default: '' },
    webhookSecretEnc: { type: String, default: '' },

    // 'live' or 'test', derived from the key id prefix. Stored so the panel can
    // warn loudly when real money is in play.
    mode: { type: String, enum: ['live', 'test', 'unknown'], default: 'unknown' },

    // Who changed the keys last, for the audit line in the panel.
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.PaymentSetting ||
  mongoose.model('PaymentSetting', PaymentSettingSchema);
