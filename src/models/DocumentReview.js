import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * DocumentReview — one document a client had checked.
 *
 * Both kinds are paid through Razorpay before anything is reviewed. The file
 * is held privately (like verification documents — never a public URL) and
 * only ever served to the client, the assigned lawyer and an admin.
 *
 * kind 'ai'     — flat fee. pending → paid → done. Once the AI has read it the
 *                 file is deleted; only the findings are kept.
 * kind 'expert' — priced by the page. pending → paid → assigned → delivered,
 *                 or paid | assigned → cancelled (refund from Razorpay).
 */
const FindingSchema = new Schema(
  {
    title: { type: String, default: '' },
    detail: { type: String, default: '' },
    severity: { type: String, default: '' },
  },
  { _id: false }
);

const DocumentReviewSchema = new Schema(
  {
    kind: { type: String, enum: ['ai', 'expert'], required: true, index: true },

    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    userPhone: { type: String, default: '' },

    fileName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    pages: { type: Number, default: 1 },
    // Held until the review is done (AI) or for the life of the request (expert).
    data: { type: Buffer, select: false },
    fileDeleted: { type: Boolean, default: false },
    // When an AI read was last started — stops two callers running it at once.
    runStartedAt: { type: Date, default: null },

    area: { type: String, default: 'other' },
    question: { type: String, default: '' },

    // AI findings.
    ai: {
      documentType: { type: String, default: '' },
      summary: { type: String, default: '' },
      riskLevel: { type: String, default: '' },
      redFlags: { type: [FindingSchema], default: [] },
      missingClauses: { type: [FindingSchema], default: [] },
      keyTerms: { type: [{ label: String, value: String, _id: false }], default: [] },
      suggestions: { type: [String], default: [] },
      provider: { type: String, default: '' },
      error: { type: String, default: '' },
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'assigned', 'delivered', 'cancelled', 'done'],
      default: 'pending',
      index: true,
    },
    amount: { type: Number, default: 0 },
    razorpayOrderId: { type: String, default: '', index: true },
    razorpayPaymentId: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    // 'razorpay' or 'wallet' — a review paid from the wallet has no payment id.
    paidWith: { type: String, default: 'razorpay' },

    advocateId: { type: Schema.Types.ObjectId, ref: 'Advocate', default: null, index: true },
    advocateName: { type: String, default: '' },
    assignedAt: { type: Date, default: null },

    report: { type: String, default: '' },
    reportBy: { type: String, default: '' },
    deliveredAt: { type: Date, default: null },

    earningCredited: { type: Boolean, default: false },
    earning: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },

    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

DocumentReviewSchema.index({ userId: 1, kind: 1, createdAt: -1 });

export default mongoose.models.DocumentReview || mongoose.model('DocumentReview', DocumentReviewSchema);
