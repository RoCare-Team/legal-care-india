import { connectDB } from '@/lib/db';
import AdminTestPayment from '@/models/AdminTestPayment';

/** What an admin test charge costs, in rupees. The smallest Razorpay accepts. */
export const TEST_PAYMENT_RUPEES = 1;

/**
 * Record a captured admin test payment. Idempotent on the payment id: the
 * verify route and the webhook both call this, and the second one only marks
 * that the webhook arrived — which is half of what the test is for.
 *
 * @param {{paymentId:string, orderId?:string, amount:number, mode?:string,
 *   adminEmail?:string, via:'verify'|'webhook'}} input
 */
export async function recordTestPayment({ paymentId, orderId = '', amount, mode = '', adminEmail = '', via }) {
  await connectDB();
  const fromWebhook = via === 'webhook';

  const upsert = () => AdminTestPayment.findOneAndUpdate(
    { razorpayPaymentId: paymentId },
    {
      $setOnInsert: {
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        amount,
        mode,
        adminEmail,
        recordedBy: fromWebhook ? 'webhook' : 'verify',
      },
      ...(fromWebhook ? { $set: { webhookSeenAt: new Date() } } : {}),
    },
    { upsert: true, new: true }
  ).lean();

  try {
    return await upsert();
  } catch (err) {
    // Both paths upserting at the same instant: one insert wins the unique
    // index, and the loser's retry becomes a plain update.
    if (err?.code === 11000) return upsert();
    throw err;
  }
}
