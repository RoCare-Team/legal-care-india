'use client';

import { useEffect, useState } from 'react';
import { Video, VideoOff, PhoneOff, Loader2, Clock, Minimize2, Lock } from 'lucide-react';
import CallControls from './CallControls';
import IncomingCallCard from './IncomingCallCard';

/** MM:SS (H:MM:SS past an hour) from milliseconds. */
function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${m}:${s}` : `${m}:${s}`;
}

/**
 * The call clock. Counts up from when the consultation connected — that is
 * what the minutes are billed on — and turns red once the client's wallet has
 * under a minute left. Without a start time it falls back to the countdown.
 */
function CallTimer({ endsAt, startedAt }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!endsAt && !startedAt) return null;
  const remaining = endsAt ? new Date(endsAt).getTime() - now : Infinity;
  const shown = startedAt ? now - new Date(startedAt).getTime() : remaining;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums backdrop-blur-md ${
        remaining <= 60000 ? 'bg-red-500/80 text-white' : 'bg-white/15 text-white'
      }`}
      title={remaining <= 60000 ? 'Under a minute of balance left' : 'Call duration'}
    >
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      {fmt(shown)}
    </span>
  );
}

function Initial({ name, size = 'h-28 w-28 text-5xl' }) {
  const letter = String(name || '?').replace(/^Adv\.?\s*/i, '').trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      className={`grid place-items-center rounded-full bg-gradient-to-br from-primary-light to-primary-dark font-display font-semibold text-white ring-4 ring-white/10 ${size}`}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

/**
 * VideoCallOverlay — the full-screen call surface that sits above the chat.
 * Shared by video and audio consultations alike — pass `video={false}` for an
 * audio-only call: no camera is captured, so there's no remote video or local
 * preview to show, and the camera controls disappear from the bar.
 *
 * It stays mounted while minimized (hidden with CSS rather than unmounted) so
 * the <video> elements keep their streams and the call carries on in the
 * background while the two of them go back to typing.
 *
 * @param {object} props.call        everything returned by useVideoCall
 * @param {string} props.otherName   the other party's name
 * @param {string} [props.endsAt]    the consultation's hard end time
 * @param {string} [props.startedAt] when the consultation connected
 * @param {boolean} props.minimized
 * @param {boolean} [props.video]    false for an audio-only call
 * @param {string} [props.dismissLabel]  wording on the "call ended" button. In a
 *   chat consultation the call is one leg of a session that carries on, so it
 *   really is "Back to chat"; in a video/audio consultation the call IS the
 *   session and there is no chat behind it to go back to.
 */
export default function VideoCallOverlay({
  call, otherName, endsAt, startedAt, minimized = false, onMinimize, dismissLabel = 'Back to chat', video = true,
}) {
  const {
    phase, endNote, busy, micOn, camOn, remoteLive, reconnecting,
    localVideoRef, remoteVideoRef,
    accept, reject, end, dismiss, toggleMic, toggleCam, flipCamera,
  } = call;

  if (phase === 'idle') return null;

  const live = phase === 'connecting' || phase === 'connected';
  const status =
    phase === 'calling' ? 'Ringing…'
      : phase === 'incoming' ? (video ? 'Incoming video call' : 'Incoming call')
        : phase === 'connecting' ? 'Connecting…'
          : phase === 'connected'
            ? (reconnecting ? 'Reconnecting…' : !video ? 'Connected' : remoteLive ? 'Connected' : 'Waiting for video…')
            : 'Call ended';

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col bg-[#070D18] ${minimized ? 'hidden' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${video ? 'Video' : 'Audio'} call with ${otherName}`}
    >
      {/* Ambient glow behind everything that is not live video. */}
      <span className="pointer-events-none absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-[120px]" aria-hidden="true" />

      {/* Body */}
      <div className="relative min-h-0 flex-1">
        {/* Remote video — the call itself. Always mounted while live so the
            stream survives a minimize. Audio-only has no picture to show, so
            it stays on the avatar throughout instead. */}
        {live && video && (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`h-full w-full bg-black object-cover ${remoteLive ? '' : 'opacity-0'}`}
            />
            {!remoteLive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-white/70">
                <span className="relative">
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary-light/30" />
                  <Initial name={otherName} />
                </span>
                <p className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Connecting to {otherName}…
                </p>
              </div>
            )}
            {/* The peer went quiet — we hold the call open briefly for them. */}
            {reconnecting && remoteLive && (
              <div className="absolute left-1/2 top-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-amber-500/90 px-4 py-2 text-sm font-medium text-white shadow-card-hover">
                <Loader2 className="h-4 w-4 animate-spin" />
                Reconnecting…
              </div>
            )}
          </>
        )}

        {/* Audio-only: the avatar stays put for the whole call — there is no
            picture to switch to once connected, just the far side's voice. */}
        {live && !video && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-white/70">
            {/* remoteVideoRef still holds the <audio> element the far side's
                voice plays through — muted from view, not from sound. */}
            <audio ref={remoteVideoRef} autoPlay className="hidden" />
            <span className="relative">
              {(!remoteLive || reconnecting) && (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary-light/30" />
              )}
              <Initial name={otherName} size="h-32 w-32 text-6xl" />
            </span>
            <p className="flex items-center gap-2 text-sm">
              {!remoteLive ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Connecting to {otherName}…</>
              ) : reconnecting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Reconnecting…</>
              ) : (
                'On call'
              )}
            </p>
          </div>
        )}

        {/* Ringing (client side) */}
        {phase === 'calling' && (
          <div className="relative flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
            <span className="relative">
              <span className="absolute -inset-4 animate-ping rounded-full bg-primary-light/20" />
              <Initial name={otherName} />
            </span>
            <div>
              <h4 className="font-display text-3xl font-semibold text-white">{otherName}</h4>
              <p className="mt-1.5 text-sm text-white/60">Ringing… waiting for them to accept</p>
            </div>
            <button type="button" onClick={end} className="mt-4 flex flex-col items-center gap-2">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/40 transition-colors hover:bg-red-700">
                <PhoneOff className="h-6 w-6" />
              </span>
              <span className="text-xs font-medium text-white/70">Cancel</span>
            </button>
          </div>
        )}

        {/* Ringing (lawyer side) */}
        {phase === 'incoming' && (
          <IncomingCallCard callerName={otherName} busy={busy} onAccept={accept} onReject={reject} video={video} />
        )}

        {/* Ended */}
        {phase === 'ended' && (
          <div className="relative flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white/10 text-white/70 ring-4 ring-white/5">
              <PhoneOff className="h-8 w-8" />
            </span>
            <div>
              <h4 className="font-display text-2xl font-semibold text-white">{video ? 'Video call ended' : 'Call ended'}</h4>
              <p className="mt-1 text-sm text-white/60">{endNote}</p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="mt-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white/90"
            >
              {dismissLabel}
            </button>
          </div>
        )}

        {/* Local preview — a picture-in-picture tile above the control bar.
            Audio-only has no camera feed to show here. */}
        {video && (live || phase === 'calling') && (
          <div className="absolute bottom-28 right-4 h-36 w-24 overflow-hidden rounded-2xl bg-black shadow-2xl ring-2 ring-white/20 sm:bottom-32 sm:right-6 sm:h-48 sm:w-36">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full -scale-x-100 object-cover ${camOn ? '' : 'opacity-0'}`}
            />
            {!camOn && (
              <div className="absolute inset-0 grid place-items-center bg-[#0B1424] text-white/50">
                <VideoOff className="h-6 w-6" />
              </div>
            )}
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/80">
              You
            </span>
          </div>
        )}
      </div>

      {/* Header — floats over the video with a fade so names stay legible. */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 pb-10 pt-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Initial name={otherName} size="h-10 w-10 text-base ring-2" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white sm:text-base">{otherName}</p>
            <p className="flex items-center gap-1.5 text-xs text-white/65">
              {phase === 'connected' && remoteLive && !reconnecting && (
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              )}
              {status}
              <span className="hidden items-center gap-1 text-white/40 sm:inline-flex">
                · <Lock className="h-3 w-3" aria-hidden="true" /> Private · This call may be recorded
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {live && <CallTimer endsAt={endsAt} startedAt={startedAt} />}
          {live && onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              aria-label={dismissLabel}
              title={dismissLabel}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/80 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Controls — a floating pill, like every calling app. */}
      {live && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center bg-gradient-to-t from-black/70 to-transparent px-3 pb-5 pt-12 sm:pb-7">
          <CallControls
            micOn={micOn}
            camOn={camOn}
            onToggleMic={toggleMic}
            onToggleCam={toggleCam}
            onFlipCamera={flipCamera}
            onEnd={end}
            onMinimize={onMinimize}
            video={video}
          />
        </div>
      )}
    </div>
  );
}
