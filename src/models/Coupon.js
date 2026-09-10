import mongoose from 'mongoose';

/**
 * Coupon — a discount code an admin creates and a client types at checkout.
 *
 * Everything a code is worth is decided here and applied server-side. The
 * request only ever carries the code itself: the moment a client could send
 * the discount, a free order would be one edited request away.
 */
const { Schema } = mongoose;

const CouponSchema = new Schema(
  {
    /**
     * Stored upper-case and matched upper-case, so "save20" and "SAVE20" are
     * the same code. A client typing on a phone keyboard should not lose a
     * discount to autocapitalise.
     */
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },

    /** Shown under the code once it applies — "20% off your first order". */
    label: { type: String, default: '', trim: true },

    type: { type: String, enum: ['percent', 'flat'], default: 'percent' },

    /** Percent (0–100) when `type` is percent; rupees when flat. */
    value: { type: Number, required: true, min: 0 },

    /**
     * Ceiling on a percent discount, in rupees. Zero means no ceiling. It is
     * the difference between "20% off" on a ₹500 filing and the same code
     * taking ₹4,000 off a ₹20,000 one.
     */
    maxDiscount: { type: Number, default: 0, min: 0 },

    /** The code does not apply below this order value, in rupees. */
    minOrder: { type: Number, default: 0, min: 0 },

    /**
     * Restrict the code to particular services. Empty means every service —
     * the common case, and the reason this is not `required`.
     */
    services: { type: [Schema.Types.ObjectId], ref: 'LegalService', default: [] },

    active: { type: Boolean, default: true },

    /** Null means it never expires. */
    expiresAt: { type: Date, default: null },

    /**
     * Total redemptions allowed across all clients; zero means unlimited.
     * `usedCount` is incremented only when an order is actually paid, never
     * when a code is merely typed or an order is opened and abandoned.
     */
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },

    /** Cap per client; zero means unlimited. Counted from paid orders. */
    perUserLimit: { type: Number, default: 1, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
