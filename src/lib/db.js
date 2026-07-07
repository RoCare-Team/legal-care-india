import mongoose from 'mongoose';

/**
 * Cached MongoDB (Mongoose) connection.
 *
 * Next.js hot-reloads modules in dev, which would otherwise open a new
 * connection on every change and exhaust the Atlas connection limit. We cache
 * the connection (and its in-flight promise) on the global object so it is
 * reused across reloads and across serverless invocations.
 */
const MONGODB_URI = process.env.MONGODB_URI;

let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Add your MongoDB Atlas connection string to .env.local'
    );
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
