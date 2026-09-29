import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * NotificationLog — one row per push sent, so a notification someone says
 * never arrived can be traced: what it was, who it was for, and what Firebase
 * said about each device.
 */
const NotificationLogSchema = new Schema(
  {
    notificationId: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    route: { type: String, default: '' },
    // { kind: 'topic'|'users'|'role'|'token'|'user'|'lawyer', ... }
    target: { type: Schema.Types.Mixed, default: {} },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    removedTokens: { type: Number, default: 0 },
    dryRun: { type: Boolean, default: false },
    // 'event' for automatic pushes, or the admin's email for a manual send.
    sentBy: { type: String, default: 'event' },
    error: { type: String, default: '' },
  },
  { timestamps: true }
);

NotificationLogSchema.index({ createdAt: -1 });

export default mongoose.models.NotificationLog || mongoose.model('NotificationLog', NotificationLogSchema);
