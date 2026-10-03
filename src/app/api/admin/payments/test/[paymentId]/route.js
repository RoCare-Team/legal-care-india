import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import AdminTestPayment from '@/models/AdminTestPayment';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/payments/test/:paymentId — has the webhook for this test
 * payment arrived yet? Polled for a short while after a test, because the
 * webhook is the half that silently breaks: a wrong URL or secret in the
 * Razorpay dashboard shows no error anywhere until a browser closes mid-payment.
 */
export async function GET(_request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const { paymentId } = await params;
  await connectDB();
  const doc = await AdminTestPayment.findOne({ razorpayPaymentId: String(paymentId) }).lean();

  return NextResponse.json({
    found: Boolean(doc),
    webhookSeen: Boolean(doc?.webhookSeenAt),
  });
}
