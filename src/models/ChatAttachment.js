import mongoose from 'mongoose';

/**
 * ChatAttachment — a file sent inside a consultation chat (a PDF of the FIR,
 * a photo of the notice, a Word draft).
 *
 * The bytes live here rather than on the message itself: messages ride on
 * every 2-second poll, and a 5 MB PDF inside the consultation document would
 * be re-sent to both browsers on each one. The message carries only the
 * metadata and this document's id.
 *
 * `userId` and `advocateId` are copied from the consultation so a download can
 * be authorised without loading it — and because the chat shows the pair's
 * whole history, a file from an earlier session must stay readable to both.
 */
const { Schema } = mongoose;

const ChatAttachmentSchema = new Schema(
  {
    consultationId: { type: Schema.Types.ObjectId, ref: 'Consultation', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    advocateId: { type: Schema.Types.ObjectId, ref: 'Advocate', required: true },
    from: { type: String, enum: ['user', 'advocate'], required: true },
    fileName: { type: String, required: true, trim: true, maxlength: 200 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    // Never selected by default — only the download route reads the bytes.
    data: { type: Buffer, required: true, select: false },
  },
  { timestamps: true }
);

export default mongoose.models.ChatAttachment ||
  mongoose.model('ChatAttachment', ChatAttachmentSchema);
