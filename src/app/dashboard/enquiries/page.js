import { redirect } from 'next/navigation';

// The old profile enquiry form was replaced by paid live-chat consultations —
// this page now lives at /dashboard/consultations. Keep old links working.
export default function LegacyEnquiriesRedirect() {
  redirect('/dashboard/consultations');
}
