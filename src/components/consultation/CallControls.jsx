'use client';

import { Mic, MicOff, Video, VideoOff, SwitchCamera, PhoneOff, MessageSquare } from 'lucide-react';

/** One round control button on the call bar. */
function ControlButton({ label, onClick, active = true, danger = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-12 w-12 place-items-center rounded-full transition-colors sm:h-14 sm:w-14 ${
        danger
          ? 'bg-red-600 text-white hover:bg-red-700'
          : active
            ? 'bg-white/15 text-white hover:bg-white/25'
            : 'bg-white text-ink hover:bg-white/90'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * CallControls — the bar along the bottom of a connected video call.
 *
 * A muted mic / stopped camera flips its button to a solid light fill, the
 * convention every calling app uses for "this is off".
 */
export default function CallControls({
  micOn, camOn, onToggleMic, onToggleCam, onFlipCamera, onEnd, onMinimize,
}) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-4 sm:gap-4">
      <ControlButton
        label={micOn ? 'Mute microphone' : 'Unmute microphone'}
        onClick={onToggleMic}
        active={micOn}
      >
        {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </ControlButton>

      <ControlButton
        label={camOn ? 'Turn camera off' : 'Turn camera on'}
        onClick={onToggleCam}
        active={camOn}
      >
        {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </ControlButton>

      <ControlButton label="Switch camera" onClick={onFlipCamera}>
        <SwitchCamera className="h-5 w-5" />
      </ControlButton>

      {onMinimize && (
        <ControlButton label="Back to chat" onClick={onMinimize}>
          <MessageSquare className="h-5 w-5" />
        </ControlButton>
      )}

      <ControlButton label="End call" onClick={onEnd} danger>
        <PhoneOff className="h-5 w-5" />
      </ControlButton>
    </div>
  );
}
