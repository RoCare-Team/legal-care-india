import { unstable_cache } from 'next/cache';
import { connectDB } from '@/lib/db';
import Testimonial from '@/models/Testimonial';

/** Cache tag — invalidated when a new testimonial is submitted. */
export const TESTIMONIALS_TAG = 'testimonials';

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

const _getTestimonials = unstable_cache(
  async () => {
    await connectDB();
    const rows = await Testimonial.find({}).sort({ createdAt: -1 }).limit(24).lean();
    return rows.map((r) => ({
      id: String(r._id),
      name: r.name,
      role: r.role || '',
      city: r.city || '',
      rating: r.rating,
      text: r.text,
      date: timeAgo(r.createdAt),
    }));
  },
  ['platform-testimonials'],
  { revalidate: 3600, tags: [TESTIMONIALS_TAG] }
);

/** Recent platform testimonials, newest first (empty if the DB is down). */
export async function getTestimonials() {
  try {
    return await _getTestimonials();
  } catch (err) {
    console.warn('getTestimonials: MongoDB unavailable', err);
    return [];
  }
}
