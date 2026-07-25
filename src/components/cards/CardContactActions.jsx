'use client';

import { useState } from 'react';
import { Phone, MessageSquare, Video } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AuthGateModal from '@/components/profile/AuthGateModal';
import BookConsultationModal from '@/components/profile/BookConsultationModal';
import VideoConsultModal from '@/components/profile/VideoConsultModal';
import AudioConsultModal from '@/components/profile/AudioConsultModal';

/**
 * CardContactActions — the Call / Chat / Email buttons on an AdvocateCard.
 * Signed-out visitors are prompted to create an account before contacting.
 * Renders three buttons (as grid children) plus the gate, call and booking modals.
 *
 * @param {object} props
 * @param {{ phone?: string, whatsapp?: string, email?: string }} props.contact
 * @param {string} props.name
 * @param {string} [props.advocateId]  lawyer MongoDB _id. Without it Call falls
 *   back to a plain `tel:` link, so older call sites keep working unchanged.
 * @param {Array} [props.plans]  the lawyer's live-chat plans. When present, a
 *   signed-in client's "Chat" opens the paid consultation booking (same as the
 *   profile's "Book Chat Consultation"); otherwise it falls back to WhatsApp.
 * @param {Array} [props.audioPlans]  the lawyer's paid audio-call plans.
 */
export default function CardContactActions({
  contact = {}, name, advocateId, plans = [], videoPlans = [], audioPlans = [],
}) {
  const { role, user, loading } = useAuth();
  const [gateOpen, setGateOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const authed = role !== null;

  /**
   * "Call" is a paid audio consultation, priced from the lawyer's own audio
   * plans — so it opens the booking modal rather than dialling. The modal
   * itself says so when the lawyer hasn't added any plan, instead of the button
   * doing nothing. Lawyers keep the plain `tel:` link the button carries.
   */
  const onCall = (e) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    if (!authed) {
      e.preventDefault();
      setGateOpen(true);
      return;
    }
    if (role !== 'user' || !advocateId) return;
    e.preventDefault();
    setAudioOpen(true);
  };

  /**
   * "Chat" opens the paid live-chat booking for a signed-in client — the same
   * flow as the profile's "Book Chat Consultation". Advocates, signed-out
   * visitors, and lawyers with no plans set fall through to the WhatsApp link.
   */
  const onChat = (e) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    if (!authed) {
      e.preventDefault();
      setGateOpen(true);
      return;
    }
    if (role === 'user' && advocateId && plans.length > 0) {
      e.preventDefault();
      setBookOpen(true);
    }
    // else: let the WhatsApp link proceed.
  };

  /**
   * "Video" opens the video-consultation booking — its own flow, priced from
   * the lawyer's separate video plans. Signed-out visitors are gated first.
   */
  const onVideo = () => {
    if (loading) return;
    if (!authed) {
      setGateOpen(true);
      return;
    }
    // Open for any signed-in client — the modal itself explains it if the lawyer
    // hasn't set up video plans yet, rather than the button doing nothing.
    if (role === 'user' && advocateId) {
      setVideoOpen(true);
    }
  };

  const base =
    'flex items-center justify-center gap-1.5 rounded-xl border border-ink/10 bg-surface py-2.5 text-sm font-medium transition-colors';

  return (
    <>
      <a
        href={`tel:${contact?.phone || ''}`}
        onClick={onCall}
        aria-label={`Call ${name}`}
        className={`${base} text-emerald-500 hover:border-emerald-400 hover:bg-emerald-500/10`}
      >
        <Phone className="h-4 w-4" />
        Call
      </a>

      <a
        href={`https://wa.me/${contact?.whatsapp || ''}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onChat}
        aria-label={`Chat with ${name}`}
        className={`${base} text-blue-500 hover:border-blue-400 hover:bg-blue-500/10`}
      >
        <MessageSquare className="h-4 w-4" />
        Chat
      </a>
      <button
        type="button"
        onClick={onVideo}
        aria-label={`Video call ${name}`}
        className={`${base} text-violet-500 hover:border-violet-400 hover:bg-violet-500/10`}
      >
        <Video className="h-4 w-4" />
        Video
      </button>

      <AuthGateModal open={gateOpen} onClose={() => setGateOpen(false)} advocateName={name} />
      <AudioConsultModal
        open={audioOpen}
        onClose={() => setAudioOpen(false)}
        advocateId={advocateId}
        advocateName={name}
        walletBalance={user?.walletBalance || 0}
        plans={audioPlans}
      />
      <BookConsultationModal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        advocateId={advocateId}
        advocateName={name}
        walletBalance={user?.walletBalance || 0}
        plans={plans}
      />
      <VideoConsultModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        advocateId={advocateId}
        advocateName={name}
        walletBalance={user?.walletBalance || 0}
        plans={videoPlans}
      />
    </>
  );
}
