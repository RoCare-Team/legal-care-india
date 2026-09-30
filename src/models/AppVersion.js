import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * AppVersion — what is live in the store for one platform, and which
 * installed builds must update. One row per platform.
 *
 * Builds are compared by build number (Android versionCode, iOS
 * CFBundleVersion), never by version name. `minSupportedBuild` 0 means force
 * update is off.
 */
const AppVersionSchema = new Schema(
  {
    platform: { type: String, enum: ['android', 'ios'], required: true, unique: true },
    latestVersion: { type: String, default: '' },
    latestBuild: { type: Number, default: 0, min: 0 },
    minSupportedBuild: { type: Number, default: 0, min: 0 },
    optionalTitle: { type: String, default: '' },
    optionalMessage: { type: String, default: '' },
    forceTitle: { type: String, default: '' },
    forceMessage: { type: String, default: '' },
    storeUrl: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.AppVersion || mongoose.model('AppVersion', AppVersionSchema);
