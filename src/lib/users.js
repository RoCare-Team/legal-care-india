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
    walletBalance: u.walletBalance || 0,
    walletTransactions: (u.walletTransactions || [])
      .map((t) => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        note: t.note || '',
        createdAt: t.createdAt,
      }))
      // Newest first.
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    createdAt: u.createdAt,
  };
}

/** Full user by id (without the password hash), or null. */
export async function getUserById(id) {
  await connectDB();
  const user = await User.findById(id).select('-passwordHash').lean();
  return serialize(user);
}

/**
 * Add money to a user's wallet and record a ledger entry. Returns the updated,
 * serialized user (or null if the user doesn't exist). Amount is in ₹.
 */
export async function addWalletFunds(id, amount, note = 'Added to wallet') {
  await connectDB();
  const value = Math.round(Number(amount) * 100) / 100; // paise-safe
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Invalid amount');
  }
  const user = await User.findByIdAndUpdate(
    id,
    {
      $inc: { walletBalance: value },
      $push: { walletTransactions: { type: 'credit', amount: value, note } },
    },
    { new: true }
  )
    .select('-passwordHash')
    .lean();
  return serialize(user);
}
