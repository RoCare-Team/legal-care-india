import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import User from '@/models/User';
import Enquiry from '@/models/Enquiry';
import Testimonial from '@/models/Testimonial';

/**
 * Admin access + read-only data for the /admin panel.
 *
 * The admin logs in with dedicated credentials (ADMIN_EMAIL + ADMIN_PASSWORD
 * from the environment) — no user/advocate account needed. On success a signed
 * httpOnly cookie is set and every /admin route checks it.
 */

/** Separate cookie so admin auth is independent of user/advocate sessions. */
export const ADMIN_COOKIE = 'lci_admin';

/** Validate a login attempt against the ADMIN_EMAIL/ADMIN_PASSWORD env vars. */
export function verifyAdminCredentials(email, password) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!adminEmail || !adminPassword) return false;
  return String(email || '').trim().toLowerCase() === adminEmail && String(password || '') === adminPassword;
}

/**
 * The current admin session from the signed cookie, or null.
 * Returns `{ email, role: 'admin' }`.
 */
export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return { email: payload.email || '', role: 'admin' };
}

/* ── Read-only data for the panel ───────────────────────────────────────── */

function iso(v) {
  return v ? new Date(v).toISOString() : null;
}

/** Every advocate (all statuses), newest first. */
export async function adminGetAdvocates() {
  await connectDB();
  const rows = await Advocate.find({})
    .sort({ createdAt: -1 })
    .select('name email phone city state legalCareId slug status verified specializations consultationFee experience createdAt')
    .lean();
  return rows.map((r) => ({
    id: String(r._id),
    name: r.name || '',
    email: r.email || '',
    phone: r.phone || '',
    city: r.city || '',
    state: r.state || '',
    legalCareId: r.legalCareId || '',
    slug: r.slug || '',
    status: r.status || 'published',
    verified: Boolean(r.verified),
    specializations: r.specializations || [],
    consultationFee: r.consultationFee || 0,
    experience: r.experience || 0,
    createdAt: iso(r.createdAt),
  }));
}

/** Every registered user (client), newest first. */
export async function adminGetUsers() {
  await connectDB();
  const rows = await User.find({})
    .sort({ createdAt: -1 })
    .select('name email phone city createdAt')
    .lean();
  return rows.map((r) => ({
    id: String(r._id),
    name: r.name || '',
    email: r.email || '',
    phone: r.phone || '',
    city: r.city || '',
    createdAt: iso(r.createdAt),
  }));
}

/** Every consultation enquiry/booking, newest first. */
export async function adminGetEnquiries() {
  await connectDB();
  const rows = await Enquiry.find({}).sort({ createdAt: -1 }).lean();
  return rows.map((r) => ({
    id: String(r._id),
    advocateName: r.advocateName || '',
    name: r.name || '',
    email: r.email || '',
    phone: r.phone || '',
    message: r.message || '',
    preferredDate: r.preferredDate || '',
    status: r.status || 'new',
    createdAt: iso(r.createdAt),
  }));
}

/** Every platform testimonial, newest first. */
export async function adminGetTestimonials() {
  await connectDB();
  const rows = await Testimonial.find({}).sort({ createdAt: -1 }).lean();
  return rows.map((r) => ({
    id: String(r._id),
    name: r.name || '',
    role: r.role || '',
    city: r.city || '',
    rating: r.rating || 0,
    text: r.text || '',
    createdAt: iso(r.createdAt),
  }));
}

/** Dashboard counts for the overview page (resilient to DB hiccups). */
export async function adminGetCounts() {
  try {
    await connectDB();
    const [advocates, users, enquiries, testimonials] = await Promise.all([
      Advocate.countDocuments({}),
      User.countDocuments({}),
      Enquiry.countDocuments({}),
      Testimonial.countDocuments({}),
    ]);
    return { advocates, users, enquiries, testimonials };
  } catch {
    return { advocates: 0, users: 0, enquiries: 0, testimonials: 0 };
  }
}
