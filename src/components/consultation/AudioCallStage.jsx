'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import useVideoCall from '@/hooks/useVideoCall';
import VideoCallOverlay from './VideoCallOverlay';

/**
 * AudioCallStage — the standalone audio call for an *audio-type* consultation.
 *
 * Identical in shape to VideoCallStage (the client rings, the lawyer who
 * already accepted the booking auto-answers, hanging up ends the whole
 * session) but rides the same `useVideoCall` engine with `video: false` — no
 * camera is ever requested, so this is a voice call over the internet, not a
 * phone call. Replaces what used to be a real Tata Smartflo phone bridge.
 *
 * @param {object} props
 * @param {object} props.session      polled consultation (must be type 'audio')
 * @param {'user'|'advocate'} props.viewerRole
 * @param {string} props.otherName    the other party's name
 * @param {() => void} [props.onEnded] called once the call finishes
 */
export default function AudioCallStage({ session, viewerRole, otherName, onEnded }) {
  const active = session.status === 'active' && (session.remainingMs ?? 0) > 0;

  const call = useVideoCall({
    sessionId: session.id,
    viewerRole,
    call: session.call,
    sessionActive: active,
    video: false,
  });
  const { phase, start, accept } = call;

  // Portalled to <body>, same reasoning as VideoCallStage: opened from an
  // AdvocateCard, a fixed full-screen overlay would otherwise be trapped
  // inside the card's hover transform and clipped by its overflow.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const startedRef = useRef(false);
  const acceptedRef = useRef(false);
  const endedRef = useRef(false);

  // Client: ring the moment the session goes active (once).
  useEffect(() => {
    if (viewerRole === 'user' && active && phase === 'idle' && !startedRef.current) {
      startedRef.current = true;
      start();
    }
  }, [viewerRole, active, phase, start]);

  // Lawyer: answer the incoming ring automatically — they already agreed by
  // accepting the booking, so a second "accept" would just be friction.
  useEffect(() => {
    if (viewerRole === 'advocate' && phase === 'incoming' && !acceptedRef.current) {
      acceptedRef.current = true;
      accept();
    }
  }, [viewerRole, phase, accept]);

  // A finished call takes the session down with it (once).
  useEffect(() => {
    if (phase === 'ended' && !endedRef.current) {
      endedRef.current = true;
      onEnded?.();
    }
  }, [phase, onEnded]);

  if (!mounted) return null;

  const body =
    phase === 'idle' ? (
      endedRef.current ? null : (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 bg-[#070D18] text-white">
          <span className="relative">
            <span className="absolute -inset-3 animate-ping rounded-full bg-primary-light/20" />
            <span className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary-light to-primary-dark font-display text-4xl font-semibold ring-4 ring-white/10">
              {String(otherName || '?').replace(/^Adv\.?\s*/i, '').trim().charAt(0).toUpperCase()}
            </span>
          </span>
          <p className="font-display text-2xl font-semibold">{otherName}</p>
          <p className="flex items-center gap-2 text-sm text-white/65">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Connecting your call…
          </p>
        </div>
      )
    ) : (
      <VideoCallOverlay
        call={call}
        otherName={otherName}
        endsAt={session.endsAt}
        startedAt={session.startedAt}
        minimized={false}
        // No chat behind an audio consultation, same as video — nothing to
        // minimize back to.
        onMinimize={undefined}
        dismissLabel="Close"
        video={false}
      />
    );

  return body ? createPortal(body, document.body) : null;
}
