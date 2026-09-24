import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * One slice of a call recording's audio.
 *
 * Recordings used to be written to a folder on the server. That works on a
 * machine with a disk, and not at all on the serverless host this runs on:
 * the filesystem there is read-only apart from a scratch directory that is
 * thrown away between requests, so every upload failed and every call came
 * back "No recording" in the admin panel.
 *
 * So the audio lives in the database, in slices. A slice rather than one
 * document per call because a document cannot exceed 16 MB and a long call's
 * audio can; the slices are written in order as the call runs and joined back
 * together when it is played.
 *
 * Kept in its own collection, never on the Consultation itself — a directory
 * query has no business dragging megabytes of audio across with it.
 */
const CallRecordingPartSchema = new Schema(
  {
    consultationId: { type: Schema.Types.ObjectId, ref: 'Consultation', required: true },
    /** Which call attempt inside that consultation. */
    callId: { type: String, required: true },
    /** Position in the file: slices are concatenated in this order. */
    index: { type: Number, required: true },
    data: { type: Buffer, required: true },
    size: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// The read is always "every slice of this call, in order"; the write has to be
// able to replace one slice when a browser re-sends it.
CallRecordingPartSchema.index({ consultationId: 1, callId: 1, index: 1 }, { unique: true });

export default mongoose.models.CallRecordingPart
  || mongoose.model('CallRecordingPart', CallRecordingPartSchema);
