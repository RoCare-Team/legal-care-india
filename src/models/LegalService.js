import mongoose from 'mongoose';

/**
 * LegalService — one fixed-price thing a client can buy.
 *
 * Company incorporation, a trademark filing, a rent agreement: work with a
 * known scope and a known price, sold outright. It is a different product from
 * a consultation, which is time with a particular lawyer billed by the block,
 * and the two deliberately share no schema — a service has no advocate, no
 * channel and no session, and forcing them together would put a nullable
 * lawyer on every consultation row for the sake of reuse.
 *
 * Prices live here and nowhere else. The order route reads them from this
 * document when it computes what to charge, so a client cannot name their own
 * price and a price change cannot leave an old figure quoted somewhere.
 */
const { Schema } = mongoose;

/** One numbered step of "How it works". */
const StepSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const LegalServiceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },

    /** The address this service is reached at, and the app's cache key. */
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    /**
     * Which shelf it sits on — "startup", "document", "property", and so on.
     * A free string rather than an enum: the categories are a merchandising
     * decision an admin makes, and a schema that has to be redeployed to add
     * one is a schema that stops them from trying.
     */
    category: { type: String, default: '', trim: true, index: true },

    /** One line under the title, and the card's subtitle. */
    summary: { type: String, default: '', trim: true },

    /** The long description on the detail page. */
    description: { type: String, default: '', trim: true },

    /**
     * The banner. A URL or a data URL, like every other image this platform
     * stores — see the note on Advocate.photo about the cost of the latter.
     */
    banner: { type: String, default: '' },

    /** What the client pays, in whole rupees. */
    price: { type: Number, required: true, min: 0 },

    /**
     * The struck-through figure beside it. Zero means there is no offer on,
     * and the UI shows no discount rather than "0% OFF" — a permanent fake
     * discount is the one piece of merchandising that costs trust outright.
     */
    mrp: { type: Number, default: 0, min: 0 },

    /**
     * Social proof, and every one of these is admin-entered rather than
     * computed, because nothing in this system counts them yet. They default
     * to zero and the app hides a zero: an unproven service shows no rating at
     * all, which is honest, rather than a 0.0 that reads as a bad one or a 4.8
     * that was never earned.
     */
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    purchased: { type: Number, default: 0, min: 0 },

    howItWorks: { type: [StepSchema], default: [] },

    /** What the client gets. Shown as a ticked list on the detail page. */
    includes: { type: [String], default: [] },

    /** Papers the client will be asked for. */
    documentsRequired: { type: [String], default: [] },

    /** "7–10 working days" — free text, because it varies by service. */
    turnaround: { type: String, default: '', trim: true },

    /** Off means it is not sold and not listed; the orders behind it survive. */
    active: { type: Boolean, default: true, index: true },

    /** Hand-set running order. Ties break by title, so a list is never random. */
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// The catalogue is read as "active, in this category, in running order" on
// almost every request the app makes, so that is the index it gets.
LegalServiceSchema.index({ active: 1, category: 1, sortOrder: 1 });

export default mongoose.models.LegalService ||
  mongoose.model('LegalService', LegalServiceSchema);
