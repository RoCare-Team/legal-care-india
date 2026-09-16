import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * LegalQuery — a question anyone can post without an account, offered to every
 * lawyer until one takes it.
 *
 * Different from Enquiry, which is addressed to one particular lawyer by a
 * signed-in client. This one has no lawyer until somebody claims it:
 *
 *   open      every lawyer sees the problem, the city and the practice area,
 *             but not the person's name, phone or email
 *   claimed   one lawyer took it — they get the contact details and it
 *             disappears from every other lawyer's list
 *   resolved  that lawyer finished with it; it never returns to the pool
 *   closed    removed by an admin (spam, or a duplicate)
 *
 * A claimed query can be released back to the pool, which is what a lawyer who
 * cannot help should do rather than leaving it sitting in their list.
 */
const LegalQuerySchema = new Schema(
  {
    // Who asked. Kept out of the open list — only the lawyer who claims it,
    // and an admin, ever see these.
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true },

    // What they need, and where. Both are shown in the open list, because they
    // are how a lawyer decides whether the matter is theirs to take.
    category: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    message: { type: String, required: true, trim: true },

    status: {
      type: String,
      enum: ['open', 'claimed', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },

    claimedBy: { type: Schema.Types.ObjectId, ref: 'Advocate', default: null, index: true },
    claimedByName: { type: String, default: '' },
    claimedAt: { type: Date, default: null },
    // The credit cycle the claiming lawyer paid from (see lib/queryCredits),
    // kept as the record that this claim cost a credit.
    creditCycle: { type: String, default: '' },

    resolvedAt: { type: Date, default: null },
    /** What came of it, in the lawyer's own words. Only they and an admin see it. */
    resolutionNote: { type: String, default: '' },

    // Set when the person happened to be signed in; the form never asks.
    userId: { type: String, default: '' },

    // For rate limiting and for an admin looking at a run of junk. A hash, not
    // the address itself — this is a public form, and the IP is not needed
    // after the throttle has used it.
    ipHash: { type: String, default: '', index: true },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

// The two reads that matter: the open pool, newest first, and one lawyer's own.
LegalQuerySchema.index({ status: 1, createdAt: -1 });
LegalQuerySchema.index({ claimedBy: 1, status: 1, createdAt: -1 });

export default mongoose.models.LegalQuery || mongoose.model('LegalQuery', LegalQuerySchema);
