import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import ApiKey from '@/models/ApiKey';

/**
 * API keys for the outside write API (see models/ApiKey).
 *
 * A key looks like `jl_blogs_<43 random chars>`. It is sent as
 * `Authorization: Bearer <key>` (or `X-API-Key: <key>`), hashed, and looked up
 * by the hash — the key itself is never stored or logged.
 */

const hash = (key) => crypto.createHash('sha256').update(String(key)).digest('hex');

function publicKey(k) {
  return {
    id: String(k._id),
    name: k.name,
    scope: k.scope,
    prefix: k.prefix,
    createdBy: k.createdBy || '',
    createdAt: k.createdAt || null,
    lastUsedAt: k.lastUsedAt || null,
    revoked: Boolean(k.revokedAt),
  };
}

/** Make a key. Returns the plain key — the only time it is ever available. */
export async function createApiKey({ name, scope = 'blogs', createdBy = '' }) {
  const label = String(name || '').trim().slice(0, 60);
  if (label.length < 2) {
    const e = new Error('Give the key a name, e.g. "n8n blog writer".');
    e.status = 400;
    throw e;
  }
  const key = `jl_${scope}_${crypto.randomBytes(32).toString('base64url')}`;
  await connectDB();
  const doc = await ApiKey.create({
    name: label,
    scope,
    keyHash: hash(key),
    prefix: key.slice(0, 14),
    createdBy,
  });
  return { key, apiKey: publicKey(doc.toObject()) };
}

export async function listApiKeys(scope = 'blogs') {
  await connectDB();
  const rows = await ApiKey.find({ scope }).sort({ createdAt: -1 }).lean();
  return rows.map(publicKey);
}

export async function revokeApiKey(id) {
  if (!mongoose.isValidObjectId(id)) return false;
  await connectDB();
  const res = await ApiKey.updateOne({ _id: id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  return res.modifiedCount > 0;
}

/**
 * The key a request carries, if it is live and allowed `scope`; null
 * otherwise. Notes when it was last used, so idle keys can be spotted.
 */
export async function verifyApiKey(request, scope = 'blogs') {
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const key = bearer || (request.headers.get('x-api-key') || '').trim();
  if (!key || !key.startsWith('jl_')) return null;

  await connectDB();
  const doc = await ApiKey.findOneAndUpdate(
    { keyHash: hash(key), scope, revokedAt: null },
    { $set: { lastUsedAt: new Date() } },
    { new: true }
  ).lean();
  return doc ? publicKey(doc) : null;
}
