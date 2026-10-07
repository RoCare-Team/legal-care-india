import mongoose from 'mongoose';

/**
 * ApiKey — a key an outside tool (a script, n8n, an AI writer) uses to call
 * the public write API, e.g. POST /api/v1/blogs, without an admin login.
 *
 * Only a SHA-256 of the key is stored. The key itself is shown to the admin
 * once, when it is made; a leaked database cannot be used to post.
 */
const ApiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    // What the key may do. Only 'blogs' exists today.
    scope: { type: String, required: true, enum: ['blogs'], index: true },
    keyHash: { type: String, required: true, unique: true },
    // The first characters, so the admin can tell keys apart in the list.
    prefix: { type: String, required: true },
    createdBy: { type: String, default: '' },
    lastUsedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.ApiKey || mongoose.model('ApiKey', ApiKeySchema);
