import { connectDB } from '@/lib/db';
import User from '@/models/User';

/**
 * User data-access layer (client accounts, distinct from advocates).
 */

/** Strip Mongo internals and return a plain, client-safe user object. */
function serialize(doc) {
  if (!doc) return null;
  const u = JSON.parse(JSON.stringify(doc));
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    photo: u.photo || '',
    city: u.city || '',
    createdAt: u.createdAt,
  };
}

/** Full user by id (without the password hash), or null. */
export async function getUserById(id) {
  await connectDB();
  const user = await User.findById(id).select('-passwordHash').lean();
  return serialize(user);
}
