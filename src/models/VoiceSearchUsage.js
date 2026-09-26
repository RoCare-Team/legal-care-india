import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * One caller's use of voice search, inside the current window.
 *
 * Every voice search costs real money — a speech API and a model call — and
 * the feature is open to anyone, signed in or not. So the limit is counted in
 * the database rather than in memory: the site runs as serverless functions,
 * where an in-process counter is per instance and resets whenever one is
 * recycled, which is no limit at all against the only thing worth limiting.
 *
 * `key` is the signed-in account when there is one, otherwise the caller's IP.
 * Rows expire on their own (see the TTL index) so nothing has to be swept.
 */
const VoiceSearchUsageSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    windowStartedAt: { type: Date, default: Date.now },
    count: { type: Number, default: 0 },
    // Kept only for reading the logs when something is being abused.
    lastAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Two hours of history is plenty for an hourly window, and MongoDB deletes the
// rows itself.
VoiceSearchUsageSchema.index({ lastAt: 1 }, { expireAfterSeconds: 2 * 60 * 60 });

export default mongoose.models.VoiceSearchUsage
  || mongoose.model('VoiceSearchUsage', VoiceSearchUsageSchema);
