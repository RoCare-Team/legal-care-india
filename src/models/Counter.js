import mongoose from 'mongoose';

/**
 * Counter — a named, monotonically increasing sequence.
 *
 * Backs the sequential Justiceland ID (JUSLD01, JUSLD02, …). The whole point
 * is that two registrations arriving at the same instant cannot be handed the
 * same number, so the value is only ever read through an atomic `$inc` in
 * `nextSequence` — never read-then-write.
 */
const CounterSchema = new mongoose.Schema(
  {
    // The sequence name, e.g. 'legalCareId'.
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

export default mongoose.models.Counter || mongoose.model('Counter', CounterSchema);
