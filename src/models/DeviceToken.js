import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * DeviceToken — one phone's Firebase Cloud Messaging token, and whose it is.
 *
 * One row per token, not a list on the account: the same phone can move from
 * one account to another (sign out, sign in as someone else), and a token must
 * then belong to the new account only — an upsert on `token` does that in one
 * write. Clients and lawyers share the collection; `role` says which kind of
 * account `ownerId` points at (User or Advocate).
 *
 * Lawyers who registered through the older /api/dashboard/fcm-token route are
 * still in Advocate.fcmTokens; lib/notifications reads both.
 */
const DeviceTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    role: { type: String, enum: ['client', 'lawyer'], required: true, index: true },
    platform: { type: String, enum: ['android', 'ios', 'web', 'other'], default: 'android' },
    appVersion: { type: String, default: '' },
    deviceId: { type: String, default: '' },
    locale: { type: String, default: '' },
    // Bumped on every register call; rows unseen for 60 days are dropped.
    lastSeenAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.DeviceToken || mongoose.model('DeviceToken', DeviceTokenSchema);
