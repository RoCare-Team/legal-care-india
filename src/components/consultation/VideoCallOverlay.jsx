'use client';

import { useEffect, useState } from 'react';
import { Video, VideoOff, PhoneOff, Loader2, Clock, X } from 'lucide-react';
import CallControls from './CallControls';
import IncomingCallCard from './IncomingCallCard';

/** MM:SS from milliseconds. */
function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/** The consultation countdown, reused here so the call shows the same clock. */
function CallTimer({ endsAt }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endsAt) return undefined;
    const end = new Date(endsAt).getTime();
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (!endsAt) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        remaining <= 60000 ? 'bg-red-500/20 text-red-300' : 'bg-white/15 text-white'
      }`}
    >
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      {fmt(remaining)}
    </span>
  );
}

/**
 * VideoCallOverlay — the full-screen call surface that sits above the chat.
 *
 * It stays mounted while minimized (hidden with CSS rather than unmounted) so
 * the <video> elements keep their streams and the call carries on in the
 * background while the two of them go back to typing.
 *
 * @param {object} props.call        everything returned by useVideoCall
 * @param {string} props.otherName   the other party's name
 * @param {string} [props.endsAt]    the consultation's hard end time
 * @param {boolean} props.minimized
 */
export default function VideoCallOverlay({
  call, otherName, endsAt, minimized = false, onMinimize,
}) {
  const {
    phase, endNote, busy, micOn, camOn, remoteLive, reconnecting,
    localVideoRef, remoteVideoRef,
    accept, reject, end, dismiss, toggleMic, toggleCam, flipCamera,
  } = call;

  if (phase === 'idle') return null;

  const live = phase === 'connecting' || phase === 'connected';

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col bg-ink ${minimized ? 'hidden' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Video call with ${otherName}`}
    >
      {/* Header — who, and how long is left on the consultation */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{otherName}</p>
          <p className="text-xs text-white/50">
            {phase === 'calling' && 'Ringing…'}
            {phase === 'incoming' && 'Incoming video call'}
            {phase === 'connecting' && 'Connecting…'}
            {phase === 'connected' &&
              (reconnecting ? 'Reconnecting…' : remoteLive ? 'Connected' : 'Waiting for video…')}
            {phase === 'ended' && 'Call ended'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {live && <CallTimer endsAt={endsAt} />}
          {live && onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              aria-label="Back to chat"
              className="grid h-8 w-8 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative min-h-0 flex-1">
        {/* Remote video — the call itself. Always mounted while live so the
            stream survives a minimize. */}
        {live && (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`h-full w-full bg-black object-cover ${remoteLive ? '' : 'opacity-0'}`}
            />
            {!remoteLive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Connecting to {otherName}…</p>
              </div>
            )}
            {/* The peer went quiet — we hold the call open briefly for them. */}
            {reconnecting && remoteLive && (
              <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-2 bg-amber-500/90 py-2 text-sm font-medium text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
                Reconnecting…
              </div>
            )}
          </>
        )}

        {/* Ringing (client side) */}
        {phase === 'calling' && (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
            <span className="relative grid h-24 w-24 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              <span className="grid h-24 w-24 place-items-center rounded-full bg-primary/20 text-white">
                <Video className="h-10 w-10" />
              </span>
            </span>
            <div>
              <h4 className="font-display text-2xl font-semibold text-white">{otherName}</h4>
              <p className="mt-1 text-sm text-white/60">Ringing… waiting for them to accept</p>
            </div>
            <button
              type="button"
              onClick={end}
              className="mt-2 flex flex-col items-center gap-2"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700">
                <PhoneOff className="h-6 w-6" />
              </span>
              <span className="text-xs font-medium text-white/70">Cancel</span>
            </button>
          </div>
        )}

        {/* Ringing (lawyer side) */}
        {phase === 'incoming' && (
          <IncomingCallCard
            callerName={otherName}
            busy={busy}
            onAccept={accept}
            onReject={reject}
          />
        )}

        {/* Ended */}
        {phase === 'ended' && (
          <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white/10 text-white/70">
              <PhoneOff className="h-8 w-8" />
            </span>
            <div>
              <h4 className="font-display text-xl font-semibold text-white">Video call ended</h4>
              <p className="mt-1 text-sm text-white/60">{endNote}</p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="mt-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white/90"
            >
              Back to chat
            </button>
          </div>
        )}

        {/* Local preview — a small picture-in-picture tile. */}
        {(live || phase === 'calling') && (
          <div className="absolute bottom-4 right-4 h-32 w-24 overflow-hidden rounded-2xl bg-black shadow-card-hover ring-1 ring-white/20 sm:h-40 sm:w-28">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full -scale-x-100 object-cover ${camOn ? '' : 'opacity-0'}`}
            />
            {!camOn && (
              <div className="absolute inset-0 grid place-items-center text-white/50">
                <VideoOff className="h-6 w-6" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {live && (
        <div className="shrink-0 border-t border-white/10">
          <CallControls
            micOn={micOn}
            camOn={camOn}
            onToggleMic={toggleMic}
            onToggleCam={toggleCam}
            onFlipCamera={flipCamera}
            onEnd={end}
            onMinimize={onMinimize}
          />
        </div>
      )}
    </div>
  );
}
