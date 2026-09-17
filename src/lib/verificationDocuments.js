import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import VerificationDocument, {
  DOCUMENT_KINDS, DOCUMENT_TYPES, MAX_DOCUMENT_BYTES,
} from '@/models/VerificationDocument';

/**
 * Lawyers' verification documents: upload, list, and read back.
 *
 * Nothing here checks who is asking — the routes do that. What it guarantees
 * is that a file is one of the accepted types, within size, and that there is
 * at most one of each kind per lawyer.
 */

function httpError(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

/** Metadata only — never the bytes. */
function toRow(doc) {
  return {
    id: String(doc._id),
    kind: doc.kind,
    label: DOCUMENT_KINDS[doc.kind] || doc.kind,
    fileName: doc.fileName || '',
    mimeType: doc.mimeType,
    size: doc.size || 0,
    uploadedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    reviewedAt: doc.reviewedAt ? new Date(doc.reviewedAt).toISOString() : null,
  };
}

/** The magic bytes of the formats we accept, so a renamed .exe is refused. */
function sniff(buffer) {
  if (buffer.length >= 4 && buffer.slice(0, 4).toString('ascii') === '%PDF') return 'application/pdf';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  return '';
}

/**
 * Stores (or replaces) one document for a lawyer.
 *
 * @param {string} advocateId
 * @param {string} kind       a key of DOCUMENT_KINDS
 * @param {File} file         from request.formData()
 */
export async function saveVerificationDocument(advocateId, kind, file) {
  if (!DOCUMENT_KINDS[kind]) throw httpError('Unknown document type.');
  if (!file || typeof file === 'string') throw httpError('No file received.');

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.length) throw httpError('The file is empty.');
  if (buffer.length > MAX_DOCUMENT_BYTES) throw httpError('File is too large (max 5 MB).');

  // Trust the bytes, not the name or the header the client sent.
  const mimeType = sniff(buffer);
  if (!mimeType || !DOCUMENT_TYPES[mimeType]) {
    throw httpError('Please upload a PDF, JPG or PNG file.');
  }

  await connectDB();
  const doc = await VerificationDocument.findOneAndUpdate(
    { advocateId, kind },
    {
      $set: {
        fileName: String(file.name || `${kind}.${DOCUMENT_TYPES[mimeType]}`).slice(0, 120),
        mimeType,
        size: buffer.length,
        data: buffer,
        reviewedAt: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).select('-data').lean();

  return toRow(doc);
}

/** A lawyer's documents, without their contents. */
export async function listVerificationDocuments(advocateId) {
  if (!mongoose.isValidObjectId(advocateId)) return [];
  await connectDB();
  const docs = await VerificationDocument.find({ advocateId })
    .select('-data')
    .sort({ kind: 1 })
    .lean();
  return docs.map(toRow);
}

/**
 * One document with its bytes, for streaming back. Pass `advocateId` to
 * restrict it to that lawyer's own documents.
 */
export async function readVerificationDocument(id, { advocateId } = {}) {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const filter = { _id: id };
  if (advocateId) filter.advocateId = advocateId;
  return VerificationDocument.findOne(filter).lean();
}

/** The HTTP response for a stored file: private, never cached publicly. */
export function documentResponse(doc) {
  const ext = DOCUMENT_TYPES[doc.mimeType] || 'bin';
  const safeName = String(doc.fileName || `document.${ext}`).replace(/[^\w.\- ]+/g, '_');
  return new Response(Buffer.from(doc.data.buffer ?? doc.data), {
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Length': String(doc.size || doc.data.length),
      'Content-Disposition': `inline; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
