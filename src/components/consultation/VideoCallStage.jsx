'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import useVideoCall from '@/hooks/useVideoCall';
import VideoCallOverlay from './VideoCallOverlay';

/**
 * VideoCallStage — the standalone video call for a *video-type* consultation.
 *
 * Unlike the chat, where a call is one optional leg the user rings by hand, a
 * video consultation IS the call: so this auto-connects the moment the session
 * is active — the client rings, the lawyer (who already accepted the booking)
 * auto-answers — and hanging up ends the whole session, since there's no chat to
 * fall back to. The heavy WebRTC machinery is exactly the same `useVideoCall`
 * engine the chat uses.
 *
 * @param {object} props
 * @param {object} props.session      polled consultation (must be type 'video')
 * @param {'user'|'advocate'} props.viewerRole
 * @param {string} props.otherName    the other party's name
 * @param {() => void} [props.onEnded] called once the call finishes
 */
export default function VideoCallStage({ session, viewerRole, otherName, onEnded }) {
  const active = session.status === 'active' && (session.remainingMs ?? 0) > 0;

  const call = useVideoCall({
    sessionId: session.id,
    viewerRole,
    call: session.call,
    sessionActive: active,
  });
  const { phase, start, accept } = call;

  // Portalled to <body>: opened from an AdvocateCard, this fixed full-screen
  // overlay would otherwise be trapped inside the card's hover transform and
  // clipped by its overflow — which reads as flicker and an off-centre call.
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

  // Between "session active" and the overlay taking over (idle → calling), show
  // a plain connecting screen so the visitor never stares at a blank frame.
  // Once the call has ended, though, show nothing — the parent closes the modal.
  const body =
    phase === 'idle' ? (
      endedRef.current ? null : (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-ink text-white">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
          <p className="text-sm text-white/70">Connecting your video call with {otherName}…</p>
        </div>
      )
    ) : (
      <VideoCallOverlay
        call={call}
        otherName={otherName}
        endsAt={session.endsAt}
        minimized={false}
        onMinimize={() => {}}
      />
    );

  return body ? createPortal(body, document.body) : null;
}
