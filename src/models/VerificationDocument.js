import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * VerificationDocument — a file a lawyer uploads to prove who they are: their
 * Bar Council certificate and a government ID.
 *
 * Kept out of the Advocate record and out of /public on purpose. These are
 * identity documents, so they are never served from a public URL — only the
 * lawyer who uploaded one and an admin can read it, through routes that check
 * the session first. And a PDF of a few megabytes has no business inside the
 * lawyer document every directory query reads.
 *
 * One of each kind per lawyer: uploading again replaces the previous file.
 */
export const DOCUMENT_KINDS = {
  bar_council_certificate: 'Bar Council Certificate',
  government_id: 'Government ID Proof',
};

export const DOCUMENT_TYPES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

const VerificationDocumentSchema = new Schema(
  {
    advocateId: { type: Schema.Types.ObjectId, ref: 'Advocate', required: true, index: true },
    kind: { type: String, enum: Object.keys(DOCUMENT_KINDS), required: true },
    fileName: { type: String, default: '' },
    mimeType: { type: String, required: true },
    size: { type: Number, default: 0 },
    data: { type: Buffer, required: true },
    // Set by an admin once they have looked at it.
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

VerificationDocumentSchema.index({ advocateId: 1, kind: 1 }, { unique: true });

export default mongoose.models.VerificationDocument
  || mongoose.model('VerificationDocument', VerificationDocumentSchema);
