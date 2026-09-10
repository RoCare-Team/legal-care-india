import { connectDB } from '@/lib/db';
import Counter from '@/models/Counter';
import Coupon from '@/models/Coupon';
import LegalService from '@/models/LegalService';
import ServiceOrder from '@/models/ServiceOrder';
import User from '@/models/User';
import { GST_RATE, gstOn } from '@/constants/tax';

/**
 * The fixed-price legal services marketplace.
 *
 * Everything about what an order costs is decided in this file, from the
 * catalogue and the coupon table, and never from a request body. The client
 * sends a slug, a coupon code and a yes/no on the wallet; the price, the
 * discount, the tax and the amount to collect are all worked out here. That
 * separation is the whole of the security model — there is no field a client
 * can send that lowers what they are charged.
 *
 * Money can arrive from two places on one order (the wallet and Razorpay), so
 * the wallet share is taken *before* checkout opens and held against the
 * order. The alternative — taking it after Razorpay confirms — leaves a window
 * where the balance is spent elsewhere mid-checkout, and the Razorpay leg,
 * fixed when the order was created, no longer covers the rest.
 */

/** An unpaid order stops holding the client's money after this long. */
export const PENDING_TTL_MS = 30 * 60 * 1000;

/** Statuses that mean the money was actually collected. */
const PAID_STATUSES = ['paid', 'inProgress', 'completed', 'refunded'];

/* ------------------------------------------------------------------ *
 * Catalogue
 * ------------------------------------------------------------------ */

/**
 * A catalogue entry as the app sees it.
 *
 * `mrp` is dropped unless it is genuinely above the price, so a struck-through
 * figure on a card always means a real saving.
 */
export function serializeService(doc, { full = false } = {}) {
  if (!doc) return null;
  const price = Math.round(Number(doc.price) || 0);
  const mrp = Math.round(Number(doc.mrp) || 0);

  const card = {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    category: doc.category || '',
    summary: doc.summary || '',
    banner: doc.banner || '',
    price,
    mrp: mrp > price ? mrp : 0,
    discountPercent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
    rating: Number(doc.rating) || 0,
    reviews: Math.round(Number(doc.reviews) || 0),
    purchased: Math.round(Number(doc.purchased) || 0),
    turnaround: doc.turnaround || '',
  };

  if (!full) return card;

  return {
    ...card,
    description: doc.description || '',
    includes: doc.includes || [],
    documentsRequired: doc.documentsRequired || [],
    howItWorks: (doc.howItWorks || []).map((s) => ({
      title: s.title,
      description: s.description || '',
    })),
  };
}

/**
 * The catalogue, filtered.
 *
 * `q` matches the title and summary only. Searching the long description as
 * well sounds more helpful and is not: a body paragraph mentioning "trademark"
 * in passing would surface a company-registration service above the trademark
 * one.
 */
export async function listServices({ category = '', q = '', limit = 100 } = {}) {
  await connectDB();

  const filter = { active: true };
  if (category) filter.category = category;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { summary: rx }];
  }

  const docs = await LegalService.find(filter)
    .sort({ sortOrder: 1, title: 1 })
    .limit(clamp(limit, 1, 200, 100))
    .lean();

  return docs.map((d) => serializeService(d));
}

/** One service by slug, with the detail-page fields. Null when withdrawn. */
export async function getServiceBySlug(slug) {
  await connectDB();
  const doc = await LegalService.findOne({
    slug: String(slug || '').toLowerCase().trim(),
    active: true,
  }).lean();
  return serializeService(doc, { full: true });
}

/**
 * The categories that actually have something in them, with counts.
 *
 * Read from the services rather than from a fixed list, so a category cannot
 * appear as an empty shelf after its last service is withdrawn.
 */
export async function listServiceCategories() {
  await connectDB();
  const rows = await LegalService.aggregate([
    { $match: { active: true, category: { $nin: ['', null] } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ name: r._id, count: r.count }));
}

/* ------------------------------------------------------------------ *
 * Coupons
 * ------------------------------------------------------------------ */

/**
 * What a code is worth on this order, for this client — or why it is not.
 *
 * Returns `{ ok: false, error }` with a message meant to be shown, because
 * every failure here is something the client can act on: a wrong code, an
 * expired one, an order too small to qualify.
 *
 * @returns {Promise<{ok: boolean, error?: string, discount?: number,
 *   coupon?: object}>}
 */
export async function evaluateCoupon({ code, service, userId, base }) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return { ok: true, discount: 0, coupon: null };

  await connectDB();
  const coupon = await Coupon.findOne({ code: normalized });

  if (!coupon || !coupon.active) {
    return { ok: false, error: 'That coupon code is not valid.' };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: 'That coupon has expired.' };
  }
  if (
    coupon.services.length &&
    !coupon.services.some((id) => String(id) === String(service.id))
  ) {
    return { ok: false, error: 'That coupon does not apply to this service.' };
  }
  if (coupon.minOrder && base < coupon.minOrder) {
    return {
      ok: false,
      error: `That coupon needs an order of at least ₹${coupon.minOrder.toLocaleString('en-IN')}.`,
    };
  }

  // Redemptions are counted from paid orders, so a code is not burned by
  // someone opening checkout and walking away.
  if (coupon.usageLimit) {
    const used = await ServiceOrder.countDocuments({
      couponCode: normalized,
      status: { $in: PAID_STATUSES },
    });
    if (used >= coupon.usageLimit) {
      return { ok: false, error: 'That coupon has been fully claimed.' };
    }
  }
  if (coupon.perUserLimit && userId) {
    const mine = await ServiceOrder.countDocuments({
      couponCode: normalized,
      userId,
      status: { $in: PAID_STATUSES },
    });
    if (mine >= coupon.perUserLimit) {
      return { ok: false, error: 'You have already used that coupon.' };
    }
  }

  let discount =
    coupon.type === 'percent'
      ? Math.floor((base * Math.min(coupon.value, 100)) / 100)
      : Math.round(coupon.value);

  if (coupon.type === 'percent' && coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  // A discount can take an order to zero but never below it — a coupon worth
  // more than the service must not start paying the client.
  discount = Math.max(0, Math.min(discount, base));

  return {
    ok: true,
    discount,
    coupon: {
      code: coupon.code,
      label: coupon.label || '',
      type: coupon.type,
      value: coupon.value,
    },
  };
}

/* ------------------------------------------------------------------ *
 * Pricing
 * ------------------------------------------------------------------ */

/**
 * The full breakdown for one service, as it appears on the order summary.
 *
 * GST is charged on the discounted amount, which is what the tax is actually
 * due on — taxing the pre-discount price would overcharge every order that
 * used a coupon.
 *
 * @param {object} args
 * @param {object} args.service    a serialized catalogue entry
 * @param {string} [args.couponCode]
 * @param {string} [args.userId]
 * @param {number} [args.walletBalance]
 * @param {boolean} [args.useWallet]
 */
export async function quoteService({
  service,
  couponCode = '',
  userId = null,
  walletBalance = 0,
  useWallet = false,
}) {
  const base = Math.round(Number(service.price) || 0);

  const applied = await evaluateCoupon({ code: couponCode, service, userId, base });
  // A bad code does not fail the quote: the summary still has to render, with
  // the reason shown beside the coupon field rather than as a dead screen.
  const discount = applied.ok ? applied.discount : 0;

  const taxable = Math.max(0, base - discount);
  const gst = gstOn(taxable);
  const payable = taxable + gst;

  const balance = Math.max(0, Math.round(Number(walletBalance) || 0));
  const walletUsed = useWallet ? Math.min(balance, payable) : 0;

  return {
    amounts: {
      base,
      discount,
      gst,
      gstRate: GST_RATE,
      payable,
      walletUsed,
      razorpayAmount: payable - walletUsed,
    },
    coupon: applied.ok ? applied.coupon : null,
    couponError: applied.ok ? '' : applied.error,
    walletBalance: balance,
  };
}

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

/** Sequential, readable, and unique without a retry loop: LS-1001, LS-1002. */
async function nextReference() {
  await connectDB();
  const doc = await Counter.findOneAndUpdate(
    { _id: 'serviceOrder' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return `LS-${1000 + doc.seq}`;
}

/** An order as its owner sees it. Admin notes never appear here. */
export function serializeOrder(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    reference: doc.reference,
    status: doc.status,
    service: {
      id: String(doc.serviceId),
      title: doc.serviceTitle,
      slug: doc.serviceSlug,
      category: doc.serviceCategory || '',
    },
    amounts: {
      base: doc.amounts?.base || 0,
      discount: doc.amounts?.discount || 0,
      gst: doc.amounts?.gst || 0,
      gstRate: doc.amounts?.gstRate || 0,
      payable: doc.amounts?.payable || 0,
      walletUsed: doc.amounts?.walletUsed || 0,
      razorpayAmount: doc.amounts?.razorpayAmount || 0,
    },
    couponCode: doc.couponCode || '',
    address: doc.address || {},
    notes: doc.notes || '',
    createdAt: doc.createdAt,
    paidAt: doc.paidAt,
    completedAt: doc.completedAt,
  };
}

/**
 * Open an order and take the wallet share.
 *
 * Returns the order with `amounts.razorpayAmount` already worked out. The
 * caller opens the Razorpay order for that figure — never for one it was
 * handed — and if that fails it must cancel this order so the hold is
 * released.
 *
 * @returns {Promise<{ok: boolean, status?: number, error?: string, order?: object}>}
 */
export async function createServiceOrder({
  userId,
  slug,
  couponCode = '',
  useWallet = false,
  address = {},
  notes = '',
}) {
  await connectDB();

  const service = await getServiceBySlug(slug);
  if (!service) {
    return { ok: false, status: 404, error: 'That service is no longer available.' };
  }

  // Old holds are released first, so a client who abandoned a checkout half an
  // hour ago is not told they have no balance for this one.
  await releaseStalePendingOrders(userId);

  const user = await User.findById(userId).select('walletBalance name email phone').lean();
  if (!user) return { ok: false, status: 404, error: 'Account not found.' };

  const quote = await quoteService({
    service,
    couponCode,
    userId,
    walletBalance: user.walletBalance,
    useWallet,
  });

  // Here a bad coupon *is* fatal: the client is committing to a price, and
  // charging them the undiscounted one because their code was quietly rejected
  // is the version of this bug that ends in a chargeback.
  if (quote.couponError) {
    return { ok: false, status: 400, error: quote.couponError };
  }

  const reference = await nextReference();

  const order = await ServiceOrder.create({
    reference,
    userId,
    serviceId: service.id,
    serviceTitle: service.title,
    serviceSlug: service.slug,
    serviceCategory: service.category,
    amounts: quote.amounts,
    couponCode: quote.coupon?.code || '',
    address: {
      name: str(address.name) || user.name || '',
      email: str(address.email) || user.email || '',
      phone: str(address.phone) || user.phone || '',
      line1: str(address.line1),
      line2: str(address.line2),
      city: str(address.city),
      state: str(address.state),
      pincode: str(address.pincode),
      gstin: str(address.gstin).toUpperCase(),
    },
    notes: str(notes).slice(0, 2000),
    status: 'pending',
  });

  // Take the wallet share now. The condition on the update is what makes this
  // safe against two checkouts at once: the second fails to match and is
  // re-priced without the wallet rather than spending a balance twice.
  if (quote.amounts.walletUsed > 0) {
    const held = await User.updateOne(
      { _id: userId, walletBalance: { $gte: quote.amounts.walletUsed } },
      {
        $inc: { walletBalance: -quote.amounts.walletUsed },
        $push: {
          walletTransactions: {
            type: 'debit',
            amount: quote.amounts.walletUsed,
            note: `${service.title} (${reference})`,
            createdAt: new Date(),
          },
        },
      }
    );

    if (held.modifiedCount !== 1) {
      order.amounts.walletUsed = 0;
      order.amounts.razorpayAmount = order.amounts.payable;
    } else {
      order.walletHeld = true;
    }
    await order.save();
  }

  return { ok: true, order };
}

/**
 * Turn a captured payment into a paid order.
 *
 * Called both by the browser coming back from checkout and by the webhook when
 * it does not, so it must produce one paid order for one payment. The update
 * is conditional on the order still being unpaid, which is what decides that
 * race; the loser reports `applied: false`, which is not an error.
 *
 * A *cancelled* order is settled too, and that is deliberate. A client who
 * sits on the checkout sheet for half an hour has their order swept and their
 * wallet hold returned — and can then still complete the payment. Refusing it
 * at that point would be taking their money and delivering nothing, so the
 * order is revived and the wallet share is taken again. If their balance has
 * since gone elsewhere, the order still stands and the shortfall is recorded:
 * we are owed the difference, which is a debt to chase, not a reason to keep
 * money for work we then refuse to do.
 *
 * Authentication is the caller's job — this checks only what the callers
 * cannot see, which is that the money paid covers what the order asked for.
 *
 * @param {object} args
 * @param {string} args.orderId       our ServiceOrder id, from the order notes
 * @param {string} args.paymentId     Razorpay payment id — the idempotency key
 * @param {string} [args.razorpayOrderId]
 * @param {number} args.amountPaise   what Razorpay says was paid
 */
export async function markServiceOrderPaid({
  orderId,
  paymentId,
  razorpayOrderId = '',
  amountPaise,
}) {
  await connectDB();

  const order = await ServiceOrder.findById(orderId);
  if (!order) return { ok: false, status: 404, error: 'Order not found.' };

  if (order.razorpayPaymentId) {
    // Already settled. The same payment reported twice is the normal race and
    // is fine; a different one means something is wrong upstream.
    if (order.razorpayPaymentId === paymentId) {
      return { ok: true, applied: false, order };
    }
    return { ok: false, status: 409, error: 'That order has already been paid.' };
  }

  const paid = Math.round(Number(amountPaise) / 100);
  const expected = order.amounts.razorpayAmount;
  if (paid !== expected) {
    console.warn('service order: amount mismatch', {
      reference: order.reference,
      paid,
      expected,
    });
    return { ok: false, status: 400, error: 'Payment amount does not match the order.' };
  }

  let result;
  try {
    result = await ServiceOrder.updateOne(
      { _id: order._id, status: { $in: ['pending', 'cancelled'] } },
      {
        $set: {
          status: 'paid',
          paidAt: new Date(),
          cancelledAt: null,
          razorpayPaymentId: paymentId,
          razorpayOrderId: razorpayOrderId || order.razorpayOrderId,
          // The hold is now spent rather than releasable.
          walletHeld: false,
        },
      }
    );
  } catch (err) {
    // The unique index rejected the payment id, so it already settled some
    // other order. Refused rather than thrown: this is permanent, and a 500
    // here would have Razorpay's webhook retrying it for ever.
    if (err?.code === 11000) {
      console.warn('service order: payment already used on another order', {
        reference: order.reference,
        paymentId,
      });
      return { ok: false, status: 409, error: 'That payment is already recorded.' };
    }
    throw err;
  }

  if (result.modifiedCount !== 1) {
    // Somebody else won the race; report their outcome, not a failure.
    const fresh = await ServiceOrder.findById(order._id);
    return { ok: true, applied: false, order: fresh };
  }

  // The order was swept before the payment landed, so its wallet share has
  // already gone back. Take it again — conditionally, so a balance that is no
  // longer there simply leaves a shortfall on the order rather than driving
  // the wallet negative.
  if (order.walletRefunded && order.amounts.walletUsed > 0) {
    const retaken = await User.updateOne(
      { _id: order.userId, walletBalance: { $gte: order.amounts.walletUsed } },
      {
        $inc: { walletBalance: -order.amounts.walletUsed },
        $push: {
          walletTransactions: {
            type: 'debit',
            amount: order.amounts.walletUsed,
            note: `${order.serviceTitle} (${order.reference})`,
            createdAt: new Date(),
          },
        },
      }
    );

    await ServiceOrder.updateOne(
      { _id: order._id },
      retaken.modifiedCount === 1
        ? { $set: { walletRefunded: false } }
        : { $set: { walletRefunded: false, walletShortfall: order.amounts.walletUsed } }
    );

    if (retaken.modifiedCount !== 1) {
      console.warn('service order: wallet shortfall on revived order', {
        reference: order.reference,
        amount: order.amounts.walletUsed,
      });
    }
  }

  await bumpCounters(order);

  const fresh = await ServiceOrder.findById(order._id);
  return { ok: true, applied: true, order: fresh };
}

/**
 * A wallet-only order — nothing left for Razorpay to collect.
 *
 * Kept separate from the Razorpay path because there is no payment id to be
 * idempotent on; the guard is the order's own pending status.
 */
export async function markServiceOrderPaidByWallet(orderId) {
  await connectDB();
  const result = await ServiceOrder.updateOne(
    { _id: orderId, status: 'pending', 'amounts.razorpayAmount': 0 },
    { $set: { status: 'paid', paidAt: new Date(), walletHeld: false } }
  );
  const order = await ServiceOrder.findById(orderId);
  if (result.modifiedCount === 1) await bumpCounters(order);
  return { ok: true, applied: result.modifiedCount === 1, order };
}

/**
 * The display-only tallies that follow a sale.
 *
 * Deliberately not awaited by the payment path in a way that could fail it:
 * an order that has been paid for stays paid even if a counter does not move.
 */
async function bumpCounters(order) {
  try {
    await LegalService.updateOne({ _id: order.serviceId }, { $inc: { purchased: 1 } });
    if (order.couponCode) {
      await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
    }
  } catch (err) {
    console.error('service order: counter update failed', order.reference, err);
  }
}

/**
 * Cancel an unpaid order and give back anything held.
 *
 * `walletHeld` is cleared in the same update that reads it, so a client
 * hammering cancel cannot be refunded twice.
 */
export async function cancelServiceOrder({ orderId, userId = null }) {
  await connectDB();

  const filter = { _id: orderId, status: 'pending' };
  if (userId) filter.userId = userId;

  const order = await ServiceOrder.findOneAndUpdate(
    filter,
    { $set: { status: 'cancelled', cancelledAt: new Date(), walletHeld: false } },
    { new: false } // the pre-update doc, so `walletHeld` still says what to release
  );

  if (!order) return { ok: false, status: 404, error: 'No pending order to cancel.' };

  if (order.walletHeld && order.amounts.walletUsed > 0) {
    await User.updateOne(
      { _id: order.userId },
      {
        $inc: { walletBalance: order.amounts.walletUsed },
        $push: {
          walletTransactions: {
            type: 'credit',
            amount: order.amounts.walletUsed,
            note: `Refund — ${order.reference} cancelled`,
            createdAt: new Date(),
          },
        },
      }
    );
    // Recorded so that if this order is later paid after all — the sweep can
    // run while a checkout sheet is still open — settlement knows the hold has
    // to be taken again rather than assuming it is still held.
    await ServiceOrder.updateOne({ _id: order._id }, { $set: { walletRefunded: true } });
  }

  return { ok: true, refunded: order.walletHeld ? order.amounts.walletUsed : 0 };
}

/**
 * Release holds from checkouts that were never finished.
 *
 * Lazy rather than scheduled: this runs when the client next opens their
 * orders or starts a new one, which is exactly when a stranded hold would
 * otherwise be noticed as missing balance. There is no cron on this platform,
 * and adding one for this would be a lot of machinery for a rare case.
 */
export async function releaseStalePendingOrders(userId) {
  await connectDB();
  const cutoff = new Date(Date.now() - PENDING_TTL_MS);
  const stale = await ServiceOrder.find({
    userId,
    status: 'pending',
    createdAt: { $lt: cutoff },
  }).select('_id');

  for (const doc of stale) {
    await cancelServiceOrder({ orderId: doc._id, userId });
  }
  return stale.length;
}

/** Orders belonging to one client, newest first. */
export async function listOrdersForUser(userId, { limit = 50 } = {}) {
  await connectDB();
  await releaseStalePendingOrders(userId);
  const docs = await ServiceOrder.find({ userId })
    .sort({ createdAt: -1 })
    .limit(clamp(limit, 1, 100, 50))
    .lean();
  return docs.map(serializeOrder);
}

/* ------------------------------------------------------------------ *
 * Admin input
 * ------------------------------------------------------------------ */

/**
 * Pull the catalogue fields out of an admin request body.
 *
 * Shared by the create and edit routes. `partial` leaves out anything the body
 * did not mention, so an edit that only changes the price cannot blank the
 * description by omission — the difference between a PATCH and a PUT, made
 * explicit because the same validation has to serve both.
 *
 * @returns {{values?: object, error?: string}}
 */
export function readServiceFields(body, { partial = false } = {}) {
  const values = {};
  const has = (key) => body?.[key] !== undefined;

  if (!partial || has('title')) {
    const title = str(body?.title);
    if (title.length < 3) return { error: 'Enter the service title.' };
    values.title = title;
  }

  if (!partial || has('price')) {
    const price = Number(body?.price);
    if (!Number.isFinite(price) || price < 0) return { error: 'Enter a valid price.' };
    values.price = Math.round(price);
  }

  if (!partial || has('mrp')) {
    values.mrp = Math.max(0, Math.round(Number(body?.mrp) || 0));
  }

  for (const key of ['category', 'summary', 'description', 'banner', 'turnaround']) {
    if (!partial || has(key)) values[key] = str(body?.[key]);
  }

  for (const key of ['rating', 'reviews', 'purchased', 'sortOrder']) {
    if (!partial || has(key)) values[key] = Math.max(0, Number(body?.[key]) || 0);
  }
  if (values.rating !== undefined) values.rating = Math.min(5, values.rating);

  for (const key of ['includes', 'documentsRequired']) {
    if (!partial || has(key)) values[key] = toList(body?.[key]);
  }

  if (!partial || has('howItWorks')) {
    values.howItWorks = (Array.isArray(body?.howItWorks) ? body.howItWorks : [])
      .map((s) => ({ title: str(s?.title), description: str(s?.description) }))
      .filter((s) => s.title);
  }

  if (has('active')) values.active = Boolean(body.active);
  else if (!partial) values.active = true;

  return { values };
}

/**
 * Pull the coupon fields out of an admin request body.
 *
 * The code itself is only accepted on creation. Editing it would silently
 * detach a live code from every order already placed with it, since orders
 * record the code as text rather than a reference.
 *
 * @returns {{values?: object, error?: string}}
 */
export function readCouponFields(body, { partial = false } = {}) {
  const values = {};
  const has = (key) => body?.[key] !== undefined;

  if (!partial) {
    const code = str(body?.code).toUpperCase();
    if (!/^[A-Z0-9_-]{3,24}$/.test(code)) {
      return { error: 'Codes are 3–24 letters, digits, hyphens or underscores.' };
    }
    values.code = code;
  }

  if (!partial || has('type')) {
    const type = str(body?.type) || 'percent';
    if (!['percent', 'flat'].includes(type)) {
      return { error: 'A coupon is either a percentage or a flat amount.' };
    }
    values.type = type;
  }

  if (!partial || has('value')) {
    const value = Number(body?.value);
    if (!Number.isFinite(value) || value <= 0) {
      return { error: 'Enter what the coupon is worth.' };
    }
    const type = values.type || str(body?.type) || 'percent';
    if (type === 'percent' && value > 100) {
      return { error: 'A percentage discount cannot be over 100%.' };
    }
    values.value = Math.round(value);
  }

  if (!partial || has('label')) values.label = str(body?.label);

  for (const key of ['maxDiscount', 'minOrder', 'usageLimit', 'perUserLimit']) {
    if (!partial || has(key)) values[key] = Math.max(0, Math.round(Number(body?.[key]) || 0));
  }

  if (!partial || has('expiresAt')) {
    const raw = str(body?.expiresAt);
    if (!raw) {
      values.expiresAt = null;
    } else {
      const when = new Date(raw);
      if (Number.isNaN(when.getTime())) return { error: 'That expiry date is not valid.' };
      values.expiresAt = when;
    }
  }

  if (!partial || has('services')) {
    values.services = (Array.isArray(body?.services) ? body.services : [])
      .map((id) => str(id))
      .filter(Boolean);
  }

  if (has('active')) values.active = Boolean(body.active);
  else if (!partial) values.active = true;

  return { values };
}

/* ------------------------------------------------------------------ */

/** Accept either an array or a newline-separated block of text. */
function toList(value) {
  const raw = Array.isArray(value) ? value : String(value ?? '').split('\n');
  return raw.map((v) => String(v).trim()).filter(Boolean);
}

function str(value) {
  return String(value ?? '').trim();
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), min), max);
}

/** Escape a client's search text so a stray `(` is a character, not a group. */
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
