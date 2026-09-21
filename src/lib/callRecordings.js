import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db';
import Consultation from '@/models/Consultation';

/**
 * Call recordings: one mixed audio file per call attempt, uploaded by
 * whichever side's browser/app finishes recording first once the call ends.
 *
 * Stored on disk rather than in Mongo (unlike the small verification
 * documents in verificationDocuments.js) — a recording can run to several
 * megabytes, and following the same local-disk convention as
 * /api/admin/upload keeps this consistent with how the rest of the app
 * handles files it doesn't want to put in the database. Kept OUTSIDE
 * `public/`, unlike that route's uploads — a recording is private to the two
 * participants and admin, never served unauthenticated.
 */

const MAX_BYTES = 40 * 1024 * 1024; // 40MB — generous for an audio-only recording
const ROOT = path.join(process.cwd(), 'recordings');

function httpError(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

/** Only the two participants of the session may act on its recordings. */
function assertParticipant(session, participantId, role) {
  const ok =
    (role === 'user' && String(session.userId) === String(participantId)) ||
    (role === 'advocate' && String(session.advocateId) === String(participantId));
  if (!ok) throw httpError('Not a participant.', 403);
}

/** Safe on-disk filename for one call's recording. Web records webm/opus, the
 * mobile app records AAC in an mp4 container — the extension follows the type. */
function fileFor(consultationId, callId, mimeType = 'audio/webm') {
  const safeCall = String(callId || 'call').replace(/[^a-zA-Z0-9-]/g, '');
  const ext = /mp4|m4a|aac/i.test(mimeType) ? 'm4a' : 'webm';
  return path.join(ROOT, String(consultationId), `${safeCall}.${ext}`);
}

/**
 * Save one call attempt's mixed recording, uploaded from either side once the
 * call ends. A second upload for the same `callId` (both sides finished
 * recording) overwrites — the first is not meaningfully better than the
 * second, and keeping only one avoids storing the same call twice.
 */
export async function saveCallRecording({ consultationId, participantId, role, callId, buffer, mimeType }) {
  if (!buffer?.length) throw httpError('No recording received.');
  if (buffer.length > MAX_BYTES) throw httpError('Recording is too large.');

  await connectDB();
  const session = await Consultation.findById(consultationId).select('userId advocateId recordings').lean();
  if (!session) throw httpError('Not found.', 404);
  assertParticipant(session, participantId, role);

  const filePath = fileFor(consultationId, callId, mimeType);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);

  const relative = path.relative(ROOT, filePath);
  const existing = (session.recordings || []).some((r) => r.callId === callId);
  const record = {
    callId: String(callId || ''),
    path: relative,
    mimeType: mimeType || 'audio/webm',
    size: buffer.length,
    by: role === 'advocate' ? 'advocate' : 'user',
  };

  if (existing) {
    await Consultation.updateOne(
      { _id: consultationId, 'recordings.callId': callId },
      { $set: { 'recordings.$': record } }
    );
  } else {
    await Consultation.updateOne({ _id: consultationId }, { $push: { recordings: record } });
  }

  return { callId: record.callId, size: record.size, mimeType: record.mimeType };
}

/**
 * Read one recording back, gated to the two participants or an admin.
 * `accessor` is `{ role: 'user'|'advocate'|'admin', id? }` — `id` is required
 * for participants, ignored for admin.
 */
export async function readCallRecording(consultationId, callId, accessor) {
  await connectDB();
  const session = await Consultation.findById(consultationId).select('userId advocateId recordings').lean();
  if (!session) throw httpError('Not found.', 404);

  if (accessor.role !== 'admin') assertParticipant(session, accessor.id, accessor.role);

  const record = (session.recordings || []).find((r) => r.callId === callId);
  if (!record) throw httpError('No recording for that call.', 404);

  const filePath = path.join(ROOT, record.path);
  let buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    throw httpError('Recording file is missing.', 404);
  }
  return { buffer, mimeType: record.mimeType || 'audio/webm', size: record.size || buffer.length };
}
