import { readFile } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db';
import Consultation from '@/models/Consultation';
import CallRecordingPart from '@/models/CallRecordingPart';

/**
 * Call recordings: one mixed audio file per call attempt, uploaded by
 * whichever side's browser/app finishes recording first once the call ends.
 *
 * Stored in the database, in slices (see models/CallRecordingPart). They used
 * to be written to a `recordings/` folder, which is why none of them survived:
 * the site runs on a serverless host whose filesystem is read-only, so every
 * upload failed and the admin panel showed "No recording" for every call.
 *
 * Recordings made before that change are still read from disk when the file is
 * there, so a local copy from development still plays.
 *
 * Either way they are private to the two participants and an admin — never
 * served from `public/`, and never without a session behind them.
 */

// One request's worth. The host refuses bodies much past 4.5 MB, so both
// clients send a long recording in parts rather than as one file.
const MAX_BYTES = 4 * 1024 * 1024;
// A whole streamed recording: opus runs ~1MB a minute, and a session can last
// as long as the client's wallet does.
const MAX_TOTAL_BYTES = 150 * 1024 * 1024;

/**
 * How much audio goes in one database document. A document cannot exceed
 * 16 MB, so a long recording is split; 6 MB leaves generous room for the rest
 * of the document and for BSON's own overhead.
 */
const SLICE_BYTES = 6 * 1024 * 1024;

/** Where recordings made before database storage were written. */
const ROOT = path.join(process.cwd(), 'recordings');

function httpError(message, status = 400, extra = {}) {
  const e = new Error(message);
  e.status = status;
  Object.assign(e, extra);
  return e;
}

/** Only the two participants of the session may act on its recordings. */
function assertParticipant(session, participantId, role) {
  const ok =
    (role === 'user' && String(session.userId) === String(participantId)) ||
    (role === 'advocate' && String(session.advocateId) === String(participantId));
  if (!ok) throw httpError('Not a participant.', 403);
}

/** Where a pre-database recording was written on disk. Web recorded webm/opus,
 * the mobile app records AAC in an mp4 container — the extension follows the
 * type. Only used to read those older files back. */
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

  await writeSlices(consultationId, callId, buffer, 0);

  const existing = (session.recordings || []).some((r) => r.callId === callId);
  const record = {
    callId: String(callId || ''),
    path: '',
    mimeType: mimeType || 'audio/webm',
    size: buffer.length,
    by: role === 'advocate' ? 'advocate' : 'user',
    chunks: 0,
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
 * Add the next part of a recording that is being streamed up during the call.
 *
 * The browser sends its one-second MediaRecorder chunks in order, and joined
 * end to end they are the whole webm file — so each part is simply appended.
 * `startIndex` is how many chunks the browser had already sent; it has to match
 * how many are stored, otherwise a part was lost or repeated and appending would
 * corrupt the file. A mismatch is answered with the count the server has
 * (`expected`) so the browser can carry on from there. `startIndex` 0 starts the
 * recording afresh, which is also how a browser that lost track begins again.
 */
export async function appendCallRecording({
  consultationId, participantId, role, callId, startIndex, chunkCount, buffer, mimeType,
}) {
  if (!buffer?.length) throw httpError('No recording received.');
  if (buffer.length > MAX_BYTES) throw httpError('Recording part is too large.');
  if (!callId) throw httpError('Missing call id.');

  await connectDB();
  const session = await Consultation.findById(consultationId).select('userId advocateId recordings').lean();
  if (!session) throw httpError('Not found.', 404);
  assertParticipant(session, participantId, role);

  const existing = (session.recordings || []).find((r) => r.callId === callId);
  const have = existing?.chunks || 0;
  const restart = startIndex === 0;

  if (!restart && startIndex !== have) {
    throw httpError('Recording part out of order.', 409, { expected: have });
  }
  const priorSize = restart ? 0 : existing?.size || 0;
  if (priorSize + buffer.length > MAX_TOTAL_BYTES) throw httpError('Recording is too large.');

  if (restart) await deleteSlices(consultationId, callId);
  const from = restart ? 0 : await sliceCount(consultationId, callId);
  await writeSlices(consultationId, callId, buffer, from);

  const record = {
    callId: String(callId),
    path: '',
    mimeType: mimeType || 'audio/webm',
    size: priorSize + buffer.length,
    by: role === 'advocate' ? 'advocate' : 'user',
    chunks: startIndex + (chunkCount || 0),
  };

  if (existing) {
    await Consultation.updateOne(
      { _id: consultationId, 'recordings.callId': callId },
      { $set: { 'recordings.$': record } }
    );
  } else {
    await Consultation.updateOne({ _id: consultationId }, { $push: { recordings: record } });
  }

  return { callId: record.callId, size: record.size, received: record.chunks };
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

  const slices = await CallRecordingPart.find({ consultationId, callId })
    .sort({ index: 1 })
    .select('data')
    .lean();

  let buffer;
  if (slices.length) {
    buffer = Buffer.concat(slices.map((s) => Buffer.from(s.data.buffer ?? s.data)));
  } else if (record.path) {
    // Recorded before database storage — still on the disk it was written to.
    try {
      buffer = await readFile(path.join(ROOT, record.path));
    } catch {
      throw httpError('Recording file is missing.', 404);
    }
  } else {
    throw httpError('Recording file is missing.', 404);
  }

  return { buffer, mimeType: record.mimeType || 'audio/webm', size: buffer.length };
}

/* ── slices ──────────────────────────────────────────────────────────────── */

/** How many slices this call already has. */
async function sliceCount(consultationId, callId) {
  return CallRecordingPart.countDocuments({ consultationId, callId });
}

/** Throws away a call's audio, for a recording that starts again. */
async function deleteSlices(consultationId, callId) {
  await CallRecordingPart.deleteMany({ consultationId, callId });
}

/**
 * Writes `buffer` as one or more slices, starting at `from`. Re-sending the
 * same position overwrites it, so an upload the browser repeats after a failed
 * response cannot leave the audio doubled.
 */
async function writeSlices(consultationId, callId, buffer, from) {
  const writes = [];
  let index = from;
  for (let at = 0; at < buffer.length; at += SLICE_BYTES) {
    const data = buffer.subarray(at, Math.min(at + SLICE_BYTES, buffer.length));
    writes.push({
      updateOne: {
        filter: { consultationId, callId, index },
        update: { $set: { data, size: data.length } },
        upsert: true,
      },
    });
    index += 1;
  }
  if (writes.length) await CallRecordingPart.bulkWrite(writes, { ordered: true });
}
