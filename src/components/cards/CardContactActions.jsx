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
 * @param {'default'|'compact'|'mobile'} [props.variant='default']
 *   'compact' for the condensed rail card, whose whole row is about the height
 *   of one full-size button — at the default size the three actions dominated a
 *   card meant to be a summary. 'mobile' is the taller, 44px tap target the
 *   phone listing card uses, with Video on a grey fill rather than a tint so
 *   the three read as three distinct weights at a glance.
 */
export default function CardContactActions({
  contact = {}, name, advocateId, plans = [], videoPlans = [], audioPlans = [],
  variant = 'default',
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

  // One filled action, two quiet ones. Three filled buttons in three different
  // colours competed with each other and with the card; giving Chat the single
  // accent makes the intended next step obvious at a glance.
  //
  // The quiet pair is tinted rather than white: on a white card a white button
  // with a pale border barely registers as a button at all. 'mobile' is the
  // exception — there Call keeps a white face with a visible border and Video
  // sits on grey, three distinct weights, which separates faster at arm's
  // length than two identical tints either side of the filled one.
  const SETS = {
    default: {
      base: 'flex h-11 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-all duration-200 sm:h-12 sm:gap-2 sm:rounded-[14px] sm:text-sm',
      icon: 'h-4 w-4',
      call: 'border border-primary/15 bg-primary/[0.06] text-primary hover:border-primary/35 hover:bg-primary/10',
      video: 'border border-primary/15 bg-primary/[0.06] text-primary hover:border-primary/35 hover:bg-primary/10',
      chat: 'bg-primary text-white shadow-sm hover:bg-primary-dark hover:shadow',
    },
    compact: {
      base: 'flex h-8 items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-all duration-200',
      icon: 'h-3.5 w-3.5',
      call: 'border border-primary/15 bg-primary/[0.06] text-primary hover:border-primary/35 hover:bg-primary/10',
      video: 'border border-primary/15 bg-primary/[0.06] text-primary hover:border-primary/35 hover:bg-primary/10',
      chat: 'bg-primary text-white shadow-sm hover:bg-primary-dark hover:shadow',
    },
    // 44px tall — the minimum comfortable tap target, so the row never needs a
    // second attempt on a 360px phone.
    mobile: {
      base: 'flex h-11 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-colors duration-200',
      icon: 'h-4 w-4',
      call: 'border border-primary/30 bg-white text-primary active:bg-primary/[0.06]',
      video: 'bg-slate-100 text-slate-700 active:bg-slate-200',
      chat: 'bg-primary text-white shadow-sm active:bg-primary-dark',
    },
  };
  const set = SETS[variant] || SETS.default;
  const { base, icon } = set;

  return (
    <>
      <a
        href={`tel:${contact?.phone || ''}`}
        onClick={onCall}
        aria-label={`Call ${name}`}
        className={`${base} ${set.call}`}
      >
        <Phone className={icon} />
        Call
      </a>

      <a
        href={`https://wa.me/${contact?.whatsapp || ''}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onChat}
        aria-label={`Chat with ${name}`}
        className={`${base} ${set.chat}`}
      >
        <MessageSquare className={icon} />
        Chat
      </a>
      <button
        type="button"
        onClick={onVideo}
        aria-label={`Video call ${name}`}
        className={`${base} ${set.video}`}
      >
        <Video className={icon} />
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
