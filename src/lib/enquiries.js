import { connectDB } from '@/lib/db';
import Enquiry from '@/models/Enquiry';

/**
 * Enquiry data-access layer. The advocate dashboard is rendered per-request
 * (it reads the session cookie) so these reads are not cached — the advocate
 * always sees their latest enquiries.
 */

/** Human-friendly "time ago" label from a Date/ISO value. */
function timeAgo(value) {
  if (!value) return '';
  const secs = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [name, size] of units) {
    const n = Math.floor(secs / size);
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

function serialize(r) {
  return {
    id: String(r._id),
    name: r.name,
    email: r.email || '',
    phone: r.phone,
    preferredDate: r.preferredDate || '',
    message: r.message,
    status: r.status || 'new',
    createdAt: r.createdAt,
    date: timeAgo(r.createdAt),
  };
}

/**
 * All enquiries for one advocate (by MongoDB _id), newest first.
 * Returns an empty list if the DB is unreachable.
 */
export async function getEnquiriesForAdvocate(advocateId, limit = 100) {
  try {
    await connectDB();
    const rows = await Enquiry.find({ advocateId: String(advocateId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return rows.map(serialize);
  } catch (err) {
    console.warn('getEnquiriesForAdvocate: MongoDB unavailable', err);
    return [];
  }
}

/**
 * A user's own booking enquiries (by userId), newest first. Used to show the
 * advocate's response status on the user's account page.
 */
export async function getEnquiriesForUser(userId) {
  try {
    await connectDB();
    const rows = await Enquiry.find({ userId: String(userId) })
      .sort({ createdAt: -1 })
      .lean();
    return rows.map((r) => ({
      id: String(r._id),
      advocateId: String(r.advocateId),
      advocateName: r.advocateName || '',
      status: r.status || 'new',
      createdAt: r.createdAt,
      date: timeAgo(r.createdAt),
    }));
  } catch (err) {
    console.warn('getEnquiriesForUser: MongoDB unavailable', err);
    return [];
  }
}
