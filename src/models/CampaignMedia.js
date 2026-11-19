import mongoose from 'mongoose';

/**
 * CampaignMedia — an image an admin uploaded for a WhatsApp campaign's header.
 *
 * Kept in the database, not on disk: the deploy host's filesystem is
 * read-only, and WhatsApp needs a public URL it can fetch the image from. It
 * is served from /api/campaign-media/[id].
 */
const CampaignMediaSchema = new mongoose.Schema(
  {
    contentType: { type: String, required: true },
    filename: { type: String, default: 'image' },
    data: { type: Buffer, required: true },
    size: { type: Number, default: 0 },
    uploadedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.CampaignMedia || mongoose.model('CampaignMedia', CampaignMediaSchema);
