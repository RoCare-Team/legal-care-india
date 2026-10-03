import { connectDB } from '@/lib/db';
import Consultation from '@/models/Consultation';
import ChatAttachment from '@/models/ChatAttachment';
import { addMessage } from '@/lib/consultations';
import { ATTACHMENT_MAX_BYTES, attachmentKind } from '@/constants/chatAttachments';

/**
 * Files sent inside a consultation chat.
 *
 * The upload is checked here, server-side, against the same list the picker
 * offers — the browser's `accept` attribute is a hint, not a guard.
 */

function fail(code, message) {
  const e = new Error(message);
  e.code = code;
  return e;
}

/**
 * Store a file and post it into the chat as a message.
 *
 * @param {{sessionId:string, participantId:string, role:'user'|'advocate',
 *   file: File, caption?: string}} input
 * @returns the session as addMessage returns it (with the pair's history)
 */
export async function sendChatAttachment({ sessionId, participantId, role, file, caption = '' }) {
  if (!file || typeof file.arrayBuffer !== 'function') throw fail('BAD_FILE', 'Choose a file to send.');

  const name = String(file.name || 'file').replace(/[\\/\r\n]+/g, ' ').trim().slice(0, 200) || 'file';
  const mimeType = String(file.type || '').toLowerCase();
  if (!attachmentKind(name, mimeType)) {
    throw fail('BAD_FILE', 'Send a PDF, photo, Word, Excel or text file.');
  }
  if (!file.size) throw fail('BAD_FILE', 'That file is empty.');
  if (file.size > ATTACHMENT_MAX_BYTES) {
    throw fail('BAD_FILE', `Files can be up to ${Math.round(ATTACHMENT_MAX_BYTES / 1024 / 1024)} MB.`);
  }

  await connectDB();
  const session = await Consultation.findById(sessionId).select('userId advocateId status').lean();
  if (!session) throw fail('NOT_FOUND', 'Not found');

  const isUser = role === 'user' && String(session.userId) === String(participantId);
  const isAdvocate = role === 'advocate' && String(session.advocateId) === String(participantId);
  if (!isUser && !isAdvocate) throw fail('FORBIDDEN', 'Not a participant');
  // Checked again inside addMessage, after expiry is settled; this one just
  // avoids storing bytes for a session that is plainly over.
  if (session.status !== 'active') throw fail('BAD_STATE', 'Session not active');

  const doc = await ChatAttachment.create({
    consultationId: session._id,
    userId: session.userId,
    advocateId: session.advocateId,
    from: role,
    fileName: name,
    mimeType: mimeType || 'application/octet-stream',
    size: file.size,
    data: Buffer.from(await file.arrayBuffer()),
  });

  const text = String(caption || '').trim().slice(0, 2000) || `📎 ${name}`;
  try {
    return await addMessage(sessionId, participantId, role, text, {
      id: String(doc._id),
      name,
      mimeType: doc.mimeType,
      size: doc.size,
    });
  } catch (err) {
    // The message never went out (session ended in between) — don't keep an
    // orphaned file nobody can see.
    await ChatAttachment.deleteOne({ _id: doc._id }).catch(() => {});
    throw err;
  }
}

/**
 * Load a file for download, if the viewer may see it: one of the two people
 * in the conversation, or an admin.
 *
 * @param {string} attachmentId
 * @param {{id?:string, role?:string}|null} viewer  the signed-in participant
 * @param {boolean} isAdmin
 */
export async function getChatAttachment(attachmentId, viewer, isAdmin = false) {
  await connectDB();
  if (!/^[a-f0-9]{24}$/i.test(String(attachmentId || ''))) return null;
  const doc = await ChatAttachment.findById(attachmentId).select('+data').lean();
  if (!doc) return null;

  const allowed =
    isAdmin ||
    (viewer?.role === 'user' && String(doc.userId) === String(viewer.id)) ||
    (viewer?.role === 'advocate' && String(doc.advocateId) === String(viewer.id));
  return allowed ? doc : null;
}
