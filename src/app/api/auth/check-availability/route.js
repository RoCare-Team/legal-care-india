import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';

/**
 * GET /api/auth/check-availability?email=…  |  ?phone=…
 *
 * Answers one question — is this email/mobile already registered? — so the
 * registration wizard can say so under the field the moment it is filled in,
 * rather than at the end of a five-step form where the visitor has to walk all
 * the way back to fix it.
 *
 * Deliberately says nothing beyond taken/free: no name, no status. It is an
 * unauthenticated endpoint, and anything more would turn it into a way of
 * mining the directory for contact details.
 *
 * @returns {{ field: 'email'|'phone', taken: boolean }}
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = String(searchParams.get('email') || '').trim().toLowerCase();
  const phoneRaw = String(searchParams.get('phone') || '');
  const phone = phoneRaw.replace(/\D/g, '');

  // Only well-formed values are worth a database round trip; a half-typed
  // address is not "free", it is simply not an address yet.
  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ field: 'email', taken: false });
    }
    await connectDB();
    const taken = Boolean(await Advocate.exists({ email }));
    return NextResponse.json({ field: 'email', taken });
  }

  if (phone) {
    if (phone.length < 10) return NextResponse.json({ field: 'phone', taken: false });
    // Numbers are stored as they were typed ('+91 98765 43210') as well as
    // digits-only, so match on the last ten digits either way.
    const last10 = phone.slice(-10);
    await connectDB();
    const taken = Boolean(
      await Advocate.exists({
        $or: [
          { phone: new RegExp(`${last10}$`) },
          { 'contact.phone': new RegExp(`${last10}$`) },
        ],
      })
    );
    return NextResponse.json({ field: 'phone', taken });
  }

  return NextResponse.json({ error: 'Nothing to check.' }, { status: 400 });
}
