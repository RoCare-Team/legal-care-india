'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Send, Paperclip, Camera, FileText, FileSpreadsheet, File as FileIcon, Download, Check,
  Clock, X, UploadCloud,
} from 'lucide-react';
import useConsultationChat from '@/hooks/useConsultationChat';
import { ATTACHMENT_ACCEPT, attachmentKind, formatBytes } from '@/constants/chatAttachments';

/** "7:04 pm" — the time of day a message was sent. */
function messageTime(at) {
  const d = at ? new Date(at) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
}

/** "Today" / "Yesterday" / "12 Sep 2026" — the label above each day's messages. */
function dayLabel(at) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const FILE_ICONS = { pdf: FileText, doc: FileText, sheet: FileSpreadsheet, text: FileText };

/** A file inside a bubble: a picture for images, a download card for the rest. */
function Attachment({ a, mine, uploading, progress }) {
  const kind = attachmentKind(a.name, a.mimeType);

  if (kind === 'image' && a.url) {
    return (
      <a
        href={a.local ? undefined : a.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block overflow-hidden rounded-xl"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-gated file */}
        <img
          src={a.url}
          alt={a.name}
          loading="lazy"
          className={`max-h-64 w-full min-w-[10rem] object-cover ${uploading ? 'opacity-60' : ''}`}
        />
        {uploading && <Progress value={progress} overlay />}
      </a>
    );
  }

  const Icon = FILE_ICONS[kind] || FileIcon;
  const body = (
    <>
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
          mine ? 'bg-white/15 text-white' : kind === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{a.name}</span>
        <span className={`block text-[11px] ${mine ? 'text-white/65' : 'text-ink/45'}`}>
          {uploading ? `Uploading… ${progress || 0}%` : `${formatBytes(a.size)} · ${(a.name.split('.').pop() || '').toUpperCase()}`}
        </span>
      </span>
      {!uploading && !a.local && (
        <Download className={`h-4 w-4 shrink-0 ${mine ? 'text-white/70' : 'text-ink/40'}`} aria-hidden="true" />
      )}
    </>
  );

  const cls = `flex min-w-[13rem] items-center gap-2.5 rounded-xl p-2 ${mine ? 'bg-black/10' : 'bg-ink/[0.04]'}`;
  return (
    <div>
      {uploading || a.local ? (
        <div className={cls}>{body}</div>
      ) : (
        <a href={`${a.url}?download=1`} className={`${cls} transition-opacity hover:opacity-85`} title={`Download ${a.name}`}>
          {body}
        </a>
      )}
      {uploading && <Progress value={progress} />}
    </div>
  );
}

function Progress({ value = 0, overlay = false }) {
  return (
    <span
      className={`block h-1 overflow-hidden rounded-full bg-black/15 ${overlay ? 'absolute inset-x-2 bottom-2' : 'mt-1.5'}`}
    >
      <span className="block h-full rounded-full bg-emerald-400 transition-[width]" style={{ width: `${value}%` }} />
    </span>
  );
}

/**
 * ChatThread — the message list and the composer of a consultation chat.
 *
 * Used by the chat panel and by the chat drawer inside a video or audio call,
 * so a document sent mid-call is the same message, in the same thread, as one
 * sent from the chat.
 *
 * Everything a messenger is expected to do: text with line breaks (Enter
 * sends, Shift+Enter breaks), files from the paperclip, a photo straight from
 * the phone's camera, drag-and-drop and paste, a progress bar while a file
 * uploads, image previews, day separators, and a tick once the server has it.
 *
 * @param {object} props
 * @param {string} props.sessionId
 * @param {Array}  props.messages
 * @param {'user'|'advocate'} props.viewerRole
 * @param {boolean} props.active        can messages be sent right now
 * @param {(text:string)=>Promise<void>} [props.onSend]  the parent's text sender
 * @param {(session:object)=>void} [props.onSession]
 * @param {React.ReactNode} [props.intro]   shown above the first message
 * @param {React.ReactNode} [props.empty]   shown when there are no messages
 * @param {React.ReactNode} [props.footer]  replaces the composer once inactive
 * @param {boolean} [props.compact]  tighter spacing, for the in-call drawer
 */
export default function ChatThread({
  sessionId, messages, viewerRole, active, onSend, onSession, intro, empty, footer, compact = false,
}) {
  const chat = useConsultationChat({ sessionId, messages, viewerRole, sendText: onSend, onSession });
  const [text, setText] = useState('');
  const [dragging, setDragging] = useState(false);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const inputRef = useRef(null);
  const dragDepth = useRef(0);

  const all = chat.messages;

  // Follow the newest message, and the upload bar of a file in flight.
  const lastKey = all.length ? `${all.length}:${all[all.length - 1].progress ?? ''}` : '0';
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lastKey]);

  // The error clears itself; it is a nudge, not a modal.
  useEffect(() => {
    if (!chat.error) return undefined;
    const t = setTimeout(chat.clearError, 5000);
    return () => clearTimeout(t);
  }, [chat.error, chat.clearError]);

  // The textarea grows with what is typed, up to about five lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const submit = (e) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value || !active) return;
    setText('');
    chat.sendText(value);
  };

  const sendFiles = (list) => {
    if (!active) return;
    Array.from(list || []).slice(0, 5).forEach((f) => chat.sendFile(f));
  };

  const onKeyDown = (e) => {
    // Enter sends; Shift+Enter (and IME composition) inserts a line break.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const onPaste = (e) => {
    const files = Array.from(e.clipboardData?.files || []);
    if (files.length) {
      e.preventDefault();
      sendFiles(files);
    }
  };

  // Drag-and-drop over the whole thread. A depth counter, because dragenter
  // and dragleave fire for every child the pointer crosses.
  const dragProps = active
    ? {
      onDragEnter: (e) => {
        if (!e.dataTransfer?.types?.includes('Files')) return;
        e.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      },
      onDragOver: (e) => {
        if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
      },
      onDragLeave: () => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setDragging(false);
      },
      onDrop: (e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        sendFiles(e.dataTransfer?.files);
      },
    }
    : {};

  let lastDay = '';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col" {...dragProps}>
      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 text-primary backdrop-blur-[1px]">
          <UploadCloud className="h-8 w-8" aria-hidden="true" />
          <p className="text-sm font-semibold">Drop to send</p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className={`flex-1 space-y-1.5 overflow-y-auto bg-[#F4F6FA] bg-[radial-gradient(rgb(30_58_95/0.05)_1px,transparent_1px)] [background-size:18px_18px] ${
          compact ? 'px-2.5 py-3' : 'px-3 py-4 sm:px-5'
        }`}
      >
        {intro}

        {all.length === 0
          ? empty
          : all.map((m, i) => {
            const mine = m.from === viewerRole;
            const optimistic = typeof m.id === 'string' && m.id.startsWith('tmp-');
            const grouped = i > 0 && all[i - 1].from === m.from;
            const sentAt = messageTime(m.at);
            const a = m.attachment;
            // A file sent without a caption carries "📎 name" as its text for
            // older apps; here the card already says that, so it is not repeated.
            const caption = a && m.text === `📎 ${a.name}` ? '' : m.text;

            const day = m.at ? dayLabel(m.at) : lastDay;
            const showDay = day && day !== lastDay;
            if (day) lastDay = day;

            return (
              <div key={m.id}>
                {showDay && (
                  <p className="mx-auto my-3 w-fit rounded-full bg-surface/90 px-3 py-0.5 text-[11px] font-medium text-ink/50 shadow-sm">
                    {day}
                  </p>
                )}
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${grouped && !showDay ? '' : 'pt-1.5'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl text-sm leading-relaxed shadow-sm sm:max-w-[75%] ${
                      a ? 'p-1.5' : 'px-3.5 py-2'
                    } ${
                      mine
                        ? `bg-primary text-white ${grouped ? '' : 'rounded-br-md'}`
                        : `bg-surface text-ink ring-1 ring-ink/5 ${grouped ? '' : 'rounded-bl-md'}`
                    } ${optimistic && !m.uploading ? 'opacity-80' : ''}`}
                  >
                    {a && <Attachment a={a} mine={mine} uploading={m.uploading} progress={m.progress} />}
                    <div className={a ? 'px-2 pb-0.5 pt-1' : ''}>
                      {caption && <span className="whitespace-pre-wrap break-words">{caption}</span>}
                      <span
                        className={`float-right ml-2 mt-1.5 inline-flex items-center gap-0.5 text-[10px] tabular-nums ${
                          mine ? 'text-white/60' : 'text-ink/40'
                        }`}
                      >
                        {sentAt && <time dateTime={new Date(m.at).toISOString()}>{sentAt}</time>}
                        {/* Clock until the server has it, then a tick. */}
                        {mine && (optimistic
                          ? <Clock className="h-3 w-3" aria-label="Sending" />
                          : <Check className="h-3 w-3" aria-label="Sent" />)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {chat.error && (
        <div className="absolute inset-x-3 bottom-20 z-20 flex items-start gap-2 rounded-xl bg-red-600 px-3.5 py-2.5 text-sm text-white shadow-card-hover">
          <span className="flex-1">{chat.error}</span>
          <button type="button" onClick={chat.clearError} aria-label="Dismiss" className="shrink-0 rounded-md p-0.5 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Composer, or whatever the parent shows once the session is over. */}
      {active ? (
        <form
          onSubmit={submit}
          className={`flex shrink-0 items-end gap-1.5 border-t border-ink/8 bg-surface ${compact ? 'p-2' : 'p-2.5 sm:p-3'}`}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={(e) => { sendFiles(e.target.files); e.target.value = ''; }}
          />
          {/* Opens the rear camera straight away on a phone; a file picker on desktop. */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { sendFiles(e.target.files); e.target.value = ''; }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            title="Attach a document or photo (PDF, image, Word, Excel — up to 10 MB)"
            aria-label="Attach file"
            className="grid h-11 w-10 shrink-0 place-items-center rounded-full text-ink/55 transition-colors hover:bg-ink/5 hover:text-primary"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            title="Take a photo of a document"
            aria-label="Take photo"
            className="grid h-11 w-10 shrink-0 place-items-center rounded-full text-ink/55 transition-colors hover:bg-ink/5 hover:text-primary sm:hidden"
          >
            <Camera className="h-5 w-5" />
          </button>
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder="Type a message…"
            aria-label="Message"
            className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-3xl border border-ink/10 bg-muted/60 px-4 py-2.5 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-primary/40 focus:bg-surface"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Send"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white shadow-brand transition-colors hover:bg-primary-dark disabled:opacity-40 disabled:shadow-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        footer
      )}
    </div>
  );
}
