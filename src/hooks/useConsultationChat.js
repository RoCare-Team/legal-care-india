'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ATTACHMENT_MAX_BYTES, attachmentKind } from '@/constants/chatAttachments';

/**
 * useConsultationChat — sending text and files into a live consultation, with
 * optimistic bubbles so the chat feels instant on a 2-second poll.
 *
 * Shared by the chat panel and the chat drawer inside a call, so the two can
 * never drift apart in how a message is sent or confirmed.
 *
 * A pending bubble is dropped once the server echoes a message from this side
 * with the same text. A file's message text is its caption or "📎 <name>" —
 * the same rule the server applies — so files reconcile the same way.
 *
 * @param {object} opts
 * @param {string} opts.sessionId
 * @param {Array}  opts.messages       confirmed messages from the session poll
 * @param {'user'|'advocate'} opts.viewerRole
 * @param {(text:string)=>Promise<void>} [opts.sendText]
 *   the parent's own text sender, when it has one (it may update its session
 *   state from the reply); otherwise this posts to the messages route itself
 * @param {(session:object)=>void} [opts.onSession]  fresh session from a send
 */
export default function useConsultationChat({ sessionId, messages, viewerRole, sendText, onSession }) {
  const [pending, setPending] = useState([]);
  const [error, setError] = useState('');
  const previews = useRef(new Set());

  // Object URLs for local image previews are released when the hook goes away.
  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), []);

  // Reconcile: each server message from this side consumes one matching
  // pending bubble.
  useEffect(() => {
    setPending((prev) => {
      if (!prev.length) return prev;
      const pool = (messages || []).filter((m) => m.from === viewerRole).map((m) => m.text);
      const keep = [];
      for (const pm of prev) {
        const idx = pool.indexOf(pm.text);
        if (idx >= 0 && !pm.uploading) {
          pool.splice(idx, 1);
          if (pm.attachment?.url && previews.current.has(pm.attachment.url)) {
            URL.revokeObjectURL(pm.attachment.url);
            previews.current.delete(pm.attachment.url);
          }
        } else {
          keep.push(pm);
        }
      }
      return keep.length === prev.length ? prev : keep;
    });
  }, [messages, viewerRole]);

  const tempId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const drop = (id) => setPending((p) => p.filter((m) => m.id !== id));

  const send = useCallback(async (value) => {
    const text = String(value || '').trim();
    if (!text) return;
    const id = tempId();
    setPending((p) => [...p, { id, from: viewerRole, text }]);
    try {
      if (sendText) {
        await sendText(text);
      } else {
        const res = await fetch(`/api/consultations/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Message not sent.');
        if (data.session) onSession?.(data.session);
      }
    } catch (err) {
      drop(id);
      setError(err?.message || 'Message not sent.');
    }
  }, [sessionId, viewerRole, sendText, onSession]);

  /**
   * Upload one file. XHR rather than fetch, for the progress bar — a 6 MB scan
   * on mobile data takes long enough that a silent spinner reads as stuck.
   */
  const sendFile = useCallback((file, caption = '') => {
    if (!file) return;
    if (!attachmentKind(file.name, file.type)) {
      setError(`"${file.name}" can't be sent. Send a PDF, photo, Word, Excel or text file.`);
      return;
    }
    if (file.size > ATTACHMENT_MAX_BYTES) {
      setError(`"${file.name}" is over ${Math.round(ATTACHMENT_MAX_BYTES / 1024 / 1024)} MB.`);
      return;
    }

    const id = tempId();
    const isImage = attachmentKind(file.name, file.type) === 'image';
    const previewUrl = isImage ? URL.createObjectURL(file) : '';
    if (previewUrl) previews.current.add(previewUrl);
    const text = String(caption || '').trim() || `📎 ${file.name}`;

    setPending((p) => [...p, {
      id,
      from: viewerRole,
      text,
      uploading: true,
      progress: 0,
      attachment: { id, name: file.name, size: file.size, mimeType: file.type, url: previewUrl, local: true },
    }]);

    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('caption', caption);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/consultations/${sessionId}/attachments`);
    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const progress = Math.round((e.loaded / e.total) * 100);
      setPending((p) => p.map((m) => (m.id === id ? { ...m, progress } : m)));
    };
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText || '{}'); } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        // Now an ordinary pending bubble, waiting for the poll to confirm it.
        setPending((p) => p.map((m) => (m.id === id ? { ...m, uploading: false, progress: 100 } : m)));
        if (data.session) onSession?.(data.session);
      } else {
        drop(id);
        setError(data.error || 'The file could not be sent.');
      }
    };
    xhr.onerror = () => {
      drop(id);
      setError('The file could not be sent. Check your connection.');
    };
    xhr.send(form);
  }, [sessionId, viewerRole, onSession]);

  return {
    messages: [...(messages || []), ...pending],
    sendText: send,
    sendFile,
    error,
    clearError: () => setError(''),
  };
}
