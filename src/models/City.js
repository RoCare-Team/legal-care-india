import mongoose from 'mongoose';

/**
 * City — an admin-added city that gets its own landing page (/cities/[slug])
 * and appears in the "Browse by City" grids, alongside the built-in cities in
 * src/data/cities.js.
 */
const CitySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    advocates: { type: Number, default: 0 },
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.City || mongoose.model('City', CitySchema);
