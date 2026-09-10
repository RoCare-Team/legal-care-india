import mongoose from 'mongoose';

/**
 * ServiceOrder — one purchase of one fixed-price legal service.
 *
 * The service is copied in rather than only referenced. A catalogue entry can
 * be repriced, retitled or withdrawn, and none of that may change what an
 * order from last month says the client bought and paid — an invoice that
 * rewrites itself is not an invoice.
 *
 * Money moves in at most two places: the wallet, and Razorpay. Both are
 * settled by `markServiceOrderPaid` in lib/legalServices, keyed on the payment
 * id, because the browser callback and the webhook both report the same
 * payment and whichever loses the race must be a no-op.
 *
 * Lifecycle:
 *   pending    → created, waiting on checkout. Wallet share is already held.
 *   paid       → money collected in full; work not started.
 *   inProgress → an admin has picked it up.
 *   completed  → delivered.
 *   cancelled  → abandoned or cancelled before payment; any wallet hold is
 *                returned. A paid order is never cancelled, only refunded.
 *   refunded   → money returned outside this system; recorded here.
 */
const { Schema } = mongoose;

/** Where the paperwork goes, and what the invoice is made out to. */
const AddressSchema = new Schema(
  {
    name: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    line1: { type: String, default: '', trim: true },
    line2: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    /** GSTIN, when the client is buying as a business and wants input credit. */
    gstin: { type: String, default: '', trim: true, uppercase: true },
  },
  { _id: false }
);

/**
 * What was charged, in whole rupees, with every line the client was shown.
 *
 * Stored in full rather than recomputed on read: the coupon behind `discount`
 * can be deleted and the GST rate can change, and neither may alter a total
 * that has already been collected.
 *
 *   base − discount = taxable;  taxable + gst = payable;
 *   payable − walletUsed = razorpayAmount
 */
const AmountsSchema = new Schema(
  {
    base: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    gst: { type: Number, default: 0, min: 0 },
    gstRate: { type: Number, default: 0, min: 0 },
    /** What the order comes to, tax included, before any wallet is applied. */
    payable: { type: Number, default: 0, min: 0 },
    walletUsed: { type: Number, default: 0, min: 0 },
    /** The part collected through Razorpay. Zero on a wallet-only order. */
    razorpayAmount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const ServiceOrderSchema = new Schema(
  {
    /** Human-facing reference — "LS-8F31Q2". Shown to the client and admin. */
    reference: { type: String, required: true, unique: true, uppercase: true, trim: true },

    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    serviceId: { type: Schema.Types.ObjectId, ref: 'LegalService', required: true, index: true },
    /** Snapshot of the catalogue entry as it stood when the order was placed. */
    serviceTitle: { type: String, default: '' },
    serviceSlug: { type: String, default: '' },
    serviceCategory: { type: String, default: '' },

    amounts: { type: AmountsSchema, default: () => ({}) },

    couponCode: { type: String, default: '', uppercase: true, trim: true },

    address: { type: AddressSchema, default: () => ({}) },

    /** Anything the client wanted to say about the job. */
    notes: { type: String, default: '', trim: true, maxlength: 2000 },

    status: {
      type: String,
      enum: ['pending', 'paid', 'inProgress', 'completed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },

    /**
     * True while `amounts.walletUsed` is debited from the client's balance for
     * an order that has not been paid yet. Cancelling releases it; paying
     * consumes it. Without this flag a release could run twice and hand back
     * money that was never taken.
     */
    walletHeld: { type: Boolean, default: false },

    /**
     * True once a cancellation has actually credited the hold back.
     *
     * A cancelled order can still be paid — a client who sat on the checkout
     * sheet past the sweep can finish paying afterwards — and settling it then
     * has to take the wallet share a second time. Without this flag there is
     * no way to tell an order whose hold was returned from one that never had
     * one, and the difference is whether re-taking it is a correction or a
     * double charge.
     */
    walletRefunded: { type: Boolean, default: false },

    /**
     * Wallet money an order is short by, in rupees.
     *
     * Only ever non-zero on an order that was revived after its hold had been
     * returned and spent elsewhere. The order stands and the work is owed:
     * this is the amount to chase, recorded rather than quietly written off or
     * — worse — taken out on a client who has already paid the rest.
     */
    walletShortfall: { type: Number, default: 0, min: 0 },

    razorpayOrderId: { type: String, default: '', index: true },
    /**
     * Set exactly once, by whichever of the browser callback and the webhook
     * arrives first. The unique sparse index is what makes that a race the
     * database settles rather than one the application hopes to win.
     */
    razorpayPaymentId: { type: String, default: undefined },

    paidAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    /** Admin-only working notes. Never returned to the client. */
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

ServiceOrderSchema.index(
  { razorpayPaymentId: 1 },
  { unique: true, sparse: true }
);

// "My orders", newest first — the one read the app makes on every visit to
// the orders tab.
ServiceOrderSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.ServiceOrder ||
  mongoose.model('ServiceOrder', ServiceOrderSchema);
