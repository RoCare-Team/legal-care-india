'use client';

import { useState } from 'react';
import { MessagesSquare, Loader2 } from 'lucide-react';
import ConsultationModal from './ConsultationModal';

/**
 * ViewConversationButton — opens the full saved conversation with the other
 * party, read-only and free. New messages still need a fresh (paid) session;
 * this is just the history so users can re-read past chats any time.
 *
 * @param {object} props
 * @param {string} props.id                consultation id (any session with this pair)
 * @param {string} props.otherName         fallback label until the fetch resolves
 * @param {'user'|'advocate'} props.viewerRole  aligns bubbles (mine vs theirs)
 */
export default function ViewConversationButton({ id, otherName, viewerRole }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState(otherName || '');
  const [error, setError] = useState('');

  const load = async () => {
    setOpen(true);
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/consultations/${id}/transcript`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        if (data.otherName) setName(data.otherName);
      } else {
        setError(data.error || 'Could not load the conversation.');
      }
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={load}
        title="View conversation"
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        aria-label={`View conversation with ${otherName}`}
      >
        <MessagesSquare className="h-4 w-4" />
        View chat
      </button>

      {open && (
        <ConsultationModal
          open
          onClose={() => setOpen(false)}
          title={`Conversation · ${name || otherName}`}
          icon={MessagesSquare}
        >
          <div className="max-h-[60vh] min-h-[16rem] space-y-2 overflow-y-auto bg-muted/30 p-4">
            {loading ? (
              <p className="mt-8 flex items-center justify-center gap-2 text-sm text-ink/50">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </p>
            ) : error ? (
              <p className="mt-8 text-center text-sm text-red-600">{error}</p>
            ) : messages.length === 0 ? (
              <p className="mt-8 text-center text-sm text-ink/45">
                No messages in this conversation yet.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.from === viewerRole;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                        mine
                          ? 'rounded-br-sm bg-primary text-white'
                          : 'rounded-bl-sm bg-surface text-ink shadow-sm ring-1 ring-ink/5'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t border-ink/8 bg-muted/40 px-4 py-2.5 text-center text-xs text-ink/45">
            Saved history — start a new consultation to continue chatting.
          </div>
        </ConsultationModal>
      )}
    </>
  );
}
