import mongoose from 'mongoose';

/**
 * Testimonial — a public review of the Legal Care India platform itself
 * (not tied to a single lawyer). Shown in the homepage "Client Stories".
 */
const TestimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export default mongoose.models.Testimonial ||
  mongoose.model('Testimonial', TestimonialSchema);
