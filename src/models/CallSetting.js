import mongoose from 'mongoose';

/**
 * CallSetting — the on/off switch for phone calling (Tata Smartflo), editable
 * from /admin without touching .env or redeploying.
 *
 * One document, `provider: 'tataDialer'`. Absent, or `enabled: false`, means
 * calls are not placed even though the Smartflo token is configured — the
 * token grants the *ability* to call, this grants *permission* right now.
 */
const { Schema } = mongoose;

const CallSettingSchema = new Schema(
  {
    provider: { type: String, required: true, unique: true, default: 'tataDialer' },
    enabled: { type: Boolean, default: false },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.CallSetting || mongoose.model('CallSetting', CallSettingSchema);
