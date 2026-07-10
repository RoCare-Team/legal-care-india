import mongoose from 'mongoose';

/**
 * User — a regular client account (not an advocate).
 *
 * Users can sign up to get a lightweight account on Legal Care India. For now
 * this is just identity + login credentials; richer features (saved advocates,
 * reviews, enquiries) can hang off this model later.
 */
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '' },
    photo: { type: String, default: '' },
    city: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
