import { connectDB } from '@/lib/db';
import Activity from '@/models/Activity';
import Advocate from '@/models/Advocate';
import { advocateProfilePath } from '@/utils/advocateUrl';

/**
 * Activity data-access — logs and reads a user's interactions with advocates.
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

/**
 * Record one interaction. Looks up the advocate to snapshot their name/link/
 * phone so the account history stays readable even if the profile changes.
 * Best-effort — never throws (a failed log must not break the user action).
 */
export async function logActivity({ userId, advocateId, type }) {
  try {
    await connectDB();
    const advocate = await Advocate.findById(advocateId)
      .select('name slug legalCareId city contact')
      .lean();
    if (!advocate) return;

    await Activity.create({
      userId: String(userId),
      advocateId: String(advocateId),
      advocateName: advocate.name || '',
      advocateProfilePath: advocateProfilePath(advocate),
      advocatePhone: advocate.contact?.phone || '',
      advocateCity: advocate.city || '',
      type,
    });
  } catch (err) {
    console.warn('logActivity failed', err);
  }
}

function serialize(r) {
  return {
    id: String(r._id),
    advocateId: r.advocateId || '',
    advocateName: r.advocateName || 'Advocate',
    advocateProfilePath: r.advocateProfilePath || '',
    advocatePhone: r.advocatePhone || '',
    advocateCity: r.advocateCity || '',
    type: r.type,
    createdAt: r.createdAt,
    date: timeAgo(r.createdAt),
  };
}

/** A user's recent activity, newest first. Empty if the DB is unreachable. */
export async function getUserActivity(userId, limit = 50) {
  try {
    await connectDB();
    const rows = await Activity.find({ userId: String(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return rows.map(serialize);
  } catch (err) {
    console.warn('getUserActivity: MongoDB unavailable', err);
    return [];
  }
}
