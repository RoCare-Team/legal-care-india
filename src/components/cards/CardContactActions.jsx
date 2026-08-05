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
 * @param {number} [props.chatRate]  the lawyer's ₹/min for live chat. When set, a
 *   signed-in client's "Chat" opens the paid consultation booking (same as the
 *   profile's "Book Chat Consultation"); otherwise it falls back to WhatsApp.
 * @param {number} [props.audioRate]  the lawyer's ₹/min for audio calls.
 * @param {boolean} [props.iconOnly=false]  drop the labels and render each
 *   action as a square. The three words cost a row of their own on a narrow
 *   grid card; the icons alone are understood, and the label stays on each
 *   button as its accessible name.
 * @param {'default'|'compact'|'quiet'|'mobile'} [props.variant='default']
 *   'compact' for the condensed rail card, whose whole row is about the height
 *   of one full-size button — at the default size the three actions dominated a
 *   card meant to be a summary. 'quiet' is that same size with all three as
 *   equal outlines, for a card that carries its own primary CTA below them.
 *   'mobile' is the taller, 44px tap target the phone listing card uses, with
 *   Video on a grey fill rather than a tint so the three read as three distinct
 *   weights at a glance.
 */
export default function CardContactActions({
  contact = {}, name, advocateId, chatRate = 0, videoRate = 0, audioRate = 0,
  variant = 'default', iconOnly = false,
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
    if (role === 'user' && advocateId && chatRate > 0) {
      e.preventDefault();
      setBookOpen(true);
    }
    // else: let the WhatsApp link proceed.
  };

  /**
   * "Video" opens the video-consultation booking — its own flow, priced from
   * the lawyer's separate video rate. Signed-out visitors are gated first.
   */
  const onVideo = () => {
    if (loading) return;
    if (!authed) {
      setGateOpen(true);
      return;
    }
    // Open for any signed-in client — the modal itself explains it if the lawyer
    // hasn't set a video rate yet, rather than the button doing nothing.
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
    // Three outlined buttons on a white face — for a card that carries its own
    // filled CTA beside them. Equal and quiet on purpose: the three are ways of
    // reaching the same person, so none of them outranks another, and none of
    // them should outrank the profile link they sit next to.
    quiet: {
      base: 'inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-1.5 text-[12px] font-semibold text-slate-700 transition-colors duration-200 hover:border-primary/35 hover:bg-primary/[0.04] hover:text-primary',
      icon: 'h-3.5 w-3.5 shrink-0',
      call: '',
      chat: '',
      video: '',
      // One hue per channel, on the icon only. The buttons stay white so the
      // three read as one group beside the profile link, but the colours are
      // the ones the rest of the site already uses for these actions — green
      // for a phone call, navy for chat, the brand gold for video — so each is
      // recognised before its label is read.
      callIcon: 'text-emerald-600',
      chatIcon: 'text-primary',
      videoIcon: 'text-[#B08D2A]',
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
  // Icon-only actions are squares rather than stretched pills, so the three
  // read as a tidy group beside whatever shares their row.
  // A minimum square, but free to stretch: the caller decides how much of
  // the row the three share, so they can be widened without this file caring.
  const base = iconOnly ? `${set.base} min-w-8 px-0` : set.base;
  const { icon } = set;
  const iconFor = (key) => `${icon} ${set[`${key}Icon`] || ''}`;
  const label = (text) => (iconOnly ? null : text);

  return (
    <>
      <a
        href={`tel:${contact?.phone || ''}`}
        onClick={onCall}
        aria-label={`Call ${name}`}
        title="Audio call"
        className={`${base} ${set.call}`}
      >
        <Phone className={iconFor('call')} />
        {label('Call')}
      </a>

      <a
        href={`https://wa.me/${contact?.whatsapp || ''}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onChat}
        aria-label={`Chat with ${name}`}
        title="Live chat"
        className={`${base} ${set.chat}`}
      >
        <MessageSquare className={iconFor('chat')} />
        {label('Chat')}
      </a>
      <button
        type="button"
        onClick={onVideo}
        aria-label={`Video call ${name}`}
        title="Video call"
        className={`${base} ${set.video}`}
      >
        <Video className={iconFor('video')} />
        {label('Video')}
      </button>

      <AuthGateModal open={gateOpen} onClose={() => setGateOpen(false)} advocateName={name} />
      <AudioConsultModal
        open={audioOpen}
        onClose={() => setAudioOpen(false)}
        advocateId={advocateId}
        advocateName={name}
        walletBalance={user?.walletBalance || 0}
        rate={audioRate}
      />
      <BookConsultationModal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        advocateId={advocateId}
        advocateName={name}
        walletBalance={user?.walletBalance || 0}
        rate={chatRate}
      />
      <VideoConsultModal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        advocateId={advocateId}
        advocateName={name}
        walletBalance={user?.walletBalance || 0}
        rate={videoRate}
      />
    </>
  );
}
