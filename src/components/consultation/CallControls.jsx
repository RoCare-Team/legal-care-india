'use client';

import { Mic, MicOff, Video, VideoOff, SwitchCamera, PhoneOff, MessageSquare } from 'lucide-react';

/** One round control button on the call bar, with its label underneath from `sm` up. */
function ControlButton({ label, short, onClick, active = true, danger = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="group flex flex-col items-center gap-1.5"
    >
      <span
        className={`grid place-items-center rounded-full transition-all group-active:scale-95 ${
          danger
            ? 'h-14 w-14 bg-red-600 text-white shadow-lg shadow-red-900/40 hover:bg-red-700 sm:h-16 sm:w-16'
            : `h-12 w-12 sm:h-14 sm:w-14 ${
                active ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-ink hover:bg-white/90'
              }`
        }`}
      >
        {children}
      </span>
      <span className="hidden text-[11px] font-medium text-white/70 sm:block">{short}</span>
    </button>
  );
}

/**
 * CallControls — the floating bar along the bottom of a connected call.
 *
 * A muted mic / stopped camera flips its button to a solid light fill, the
 * convention every calling app uses for "this is off". `video = false` drops
 * the camera and flip-camera buttons for an audio-only call.
 */
export default function CallControls({
  micOn, camOn, onToggleMic, onToggleCam, onFlipCamera, onEnd, onMinimize, video = true,
}) {
  return (
    <div className="flex items-end justify-center gap-3 rounded-full bg-black/35 px-4 py-3 backdrop-blur-xl sm:gap-5 sm:rounded-3xl sm:px-6">
      <ControlButton
        label={micOn ? 'Mute microphone' : 'Unmute microphone'}
        short={micOn ? 'Mute' : 'Unmute'}
        onClick={onToggleMic}
        active={micOn}
      >
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </ControlButton>

      {video && (
        <ControlButton
          label={camOn ? 'Turn camera off' : 'Turn camera on'}
          short={camOn ? 'Camera' : 'Camera off'}
          onClick={onToggleCam}
          active={camOn}
        >
          {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </ControlButton>
      )}

      <ControlButton label="End call" short="End" onClick={onEnd} danger>
        <PhoneOff className="h-6 w-6" />
      </ControlButton>

      {video && (
        <ControlButton label="Switch camera" short="Flip" onClick={onFlipCamera}>
          <SwitchCamera className="h-5 w-5" />
        </ControlButton>
      )}

      {onMinimize && (
        <ControlButton label="Back to chat" short="Chat" onClick={onMinimize}>
          <MessageSquare className="h-5 w-5" />
        </ControlButton>
      )}
    </div>
  );
}
