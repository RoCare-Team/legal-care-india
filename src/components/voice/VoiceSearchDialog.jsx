'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Mic, Square, X, Loader2, AlertCircle, Sparkles, MapPin, ShieldCheck, RotateCcw, Search,
} from 'lucide-react';
import AdvocateGridCard from '@/components/cards/AdvocateGridCard';
import {
  MAX_RECORDING_SECONDS, WARN_AT_SECONDS, PROGRESS, DISCLAIMER, MIN_AUDIO_BYTES,
} from '@/constants/voiceSearch';

/**
 * Voice legal search — say the problem, get the lawyers.
 *
 * The whole point of this screen is that someone with a legal problem does not
 * know which of twelve practice areas it belongs to, and should not have to.
 * They say it in their own words, in their own language, and the work of
 * turning that into "Labour & Employment / wage disputes / Gurgaon" happens on
 * the server (see api/voice/legal-search).
 *
 * Recording is deliberately start-and-stop rather than a live voice session:
 * an open realtime connection bills by the second for silence as well as
 * speech, and nothing here needs one. The microphone is released the instant
 * Stop is pressed — the tracks are stopped, not just paused, so the browser's
 * recording indicator goes out when the visitor expects it to.
 */

/** The container the browser will actually record in. */
function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    // Safari records mp4/aac and supports nothing above.
    'audio/mp4',
    'audio/mpeg',
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
}

const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/**
 * When the recording finishes itself.
 *
 * Measured on the loudness of the microphone rather than on any timer: once a
 * sentence has been heard, a pause this long means they have finished, and
 * hunting for a Stop button while trying to explain a legal problem is exactly
 * where people give up. Stop is still there for anyone who wants it.
 *
 * RMS rather than peak for the decision — room tone has spikes, speech has
 * body, and a threshold on peaks either cuts people off mid-sentence or never
 * fires at all. The bars on screen still follow the peak, because that is what
 * looks alive.
 */
const SPEECH_RMS = 0.02;
const SILENCE_RMS = 0.012;
const SILENCE_HOLD_MS = 1800;

/** Nothing heard at all by here: the microphone is not working, so say so. */
const GIVE_UP_ON_SILENCE_MS = 9000;

/** Shorter than this is a slip of the finger, not a problem being described. */
const MIN_SPEECH_MS = 1200;

/** The stages the request goes through, shown in order while it runs. */
const STAGES = ['uploading', 'transcribing', 'analysing', 'searching'];

export default function VoiceSearchDialog({ open, onClose }) {
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [stage, setStage] = useState('uploading');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [cityAnswer, setCityAnswer] = useState('');
  const [mounted, setMounted] = useState(false);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const tickRef = useRef(null);
  const stageRef = useRef(null);
  const cancelledRef = useRef(false);
  // The microphone's own level, watched while recording. Without it a muted
  // input, a disconnected headset or the wrong default device all look exactly
  // like a recording that simply failed — and the visitor is told to "speak a
  // little closer to the microphone" when the microphone was never listening.
  const audioCtxRef = useRef(null);
  const peakRef = useRef(0);
  // The loudest thing heard since this recording started. `level` is the
  // current frame and drives the bars; this is what decides whether anything
  // has been heard at all, because speech is mostly gaps.
  const [peak, setPeak] = useState(0);
  const [heardSpeech, setHeardSpeech] = useState(false);
  const meterRafRef = useRef(0);
  const startedAtRef = useRef(0);
  // When we last heard something that sounded like speech, and whether the
  // meter ever produced a reading at all — the second matters because a
  // browser that blocks the audio context must not be mistaken for a
  // microphone that heard nothing.
  const lastLoudAtRef = useRef(0);
  const meterReadRef = useRef(false);
  const stopRef = useRef(null);
  const [level, setLevel] = useState(0);

  useEffect(() => setMounted(true), []);

  /** Lets go of the microphone. Called on stop, on cancel and on unmount. */
  const releaseMic = useCallback(() => {
    clearInterval(tickRef.current);
    cancelAnimationFrame(meterRafRef.current);
    try {
      audioCtxRef.current?.close();
    } catch {
      /* already closed */
    }
    audioCtxRef.current = null;
    streamRef.current?.getTracks()?.forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setLevel(0);
  }, []);

  const resetAll = useCallback(() => {
    clearInterval(stageRef.current);
    releaseMic();
    chunksRef.current = [];
    setPhase('idle');
    setSeconds(0);
    setError('');
    setResult(null);
    setCityAnswer('');
  }, [releaseMic]);

  // Closing mid-recording must not leave the microphone live.
  useEffect(() => {
    if (!open) resetAll();
    return () => {
      clearInterval(stageRef.current);
      releaseMic();
    };
  }, [open, resetAll, releaseMic]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  /** Sends what was recorded, or a typed answer, and shows what came back. */
  const search = useCallback(async (payload) => {
    cancelledRef.current = false;
    setError('');
    setPhase('working');

    // The request is one round trip, but it really does pass through these
    // stages in this order, so the wait is narrated rather than blank.
    let at = 0;
    setStage(STAGES[0]);
    clearInterval(stageRef.current);
    stageRef.current = setInterval(() => {
      at = Math.min(at + 1, STAGES.length - 1);
      setStage(STAGES[at]);
    }, payload instanceof FormData ? 2200 : 1200);

    try {
      const res = await fetch('/api/voice/legal-search', {
        method: 'POST',
        ...(payload instanceof FormData
          ? { body: payload }
          : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
      });
      const data = await res.json().catch(() => ({}));
      clearInterval(stageRef.current);
      if (cancelledRef.current) return;

      if (!res.ok || !data.success) {
        // The API already speaks plain English; anything else is ours to soften.
        setError(data.error || 'Something went wrong. Please try again.');
        setPhase('error');
        return;
      }

      setResult(data);
      setPhase(data.lawyers?.length ? 'results' : 'empty');
    } catch {
      clearInterval(stageRef.current);
      if (cancelledRef.current) return;
      setError('We could not reach the server. Please check your connection and try again.');
      setPhase('error');
    }
  }, []);

  /**
   * Reads how loud the microphone is, frame by frame, for two reasons: the bars
   * on screen are proof to the visitor that they are being heard, and the peak
   * is what tells us afterwards whether the microphone ever picked anything up.
   */
  const watchLevel = useCallback(async (stream) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;

      // An audio context created after an `await` has lost the click that
      // started all this, and several browsers hand it back suspended — which
      // reads out as perfect silence for ever. The bars sat flat, the
      // recording was fine, and the screen told people their microphone was
      // not working. Resuming it is the whole fix.
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {
          /* nothing more to try; the size check below still protects us */
        }
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);

        let peak = 0;
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          peak = Math.max(peak, Math.abs(v));
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);

        meterReadRef.current = true;
        peakRef.current = Math.max(peakRef.current, peak);
        setLevel(peak);
        setPeak(peakRef.current);

        const now = Date.now();
        const ranMs = now - startedAtRef.current;
        if (rms > SPEECH_RMS) {
          if (!lastLoudAtRef.current) setHeardSpeech(true);
          lastLoudAtRef.current = now;
        }

        // Heard them, and they have stopped: that is the end of the answer.
        if (lastLoudAtRef.current && rms < SILENCE_RMS
          && now - lastLoudAtRef.current >= SILENCE_HOLD_MS
          && ranMs > MIN_SPEECH_MS) {
          stopRef.current?.();
          return;
        }

        // Never heard anything: better to say so than to record silence for a
        // minute and fail at the end of it.
        if (!lastLoudAtRef.current && ranMs > GIVE_UP_ON_SILENCE_MS) {
          stopRef.current?.();
          return;
        }

        meterRafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // No meter is a cosmetic loss; recording carries on without it, the
      // checks below fall back to the size of the clip, and Stop still works.
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
  }, []);

  // The meter runs outside React's render, so it reaches Stop through a ref
  // rather than closing over a callback that may be a render behind.
  useEffect(() => {
    stopRef.current = stopRecording;
  }, [stopRecording]);

  const startRecording = useCallback(async () => {
    setError('');
    setResult(null);
    // Cleared here, not only when a request starts: cancelling one recording
    // used to leave this set, and the next recording was then thrown away
    // silently the moment it stopped.
    cancelledRef.current = false;
    peakRef.current = 0;
    lastLoudAtRef.current = 0;
    meterReadRef.current = false;
    setPeak(0);
    setHeardSpeech(false);
    setPhase('permission');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia
      || typeof MediaRecorder === 'undefined') {
      setError('This browser cannot record audio. Please use the search box instead.');
      setPhase('error');
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (err) {
      setError(
        err?.name === 'NotAllowedError'
          ? 'Microphone access was blocked. Allow it in your browser settings and try again.'
          : 'We could not reach your microphone. Please check it and try again.'
      );
      setPhase('error');
      return;
    }

    streamRef.current = stream;
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type });
      const heldForMs = Date.now() - startedAtRef.current;
      const peak = peakRef.current;
      releaseMic();

      if (cancelledRef.current) return;

      // Three different problems that used to share one message. Which one it
      // was decides what the visitor should do about it, so each says so.
      if (heldForMs < MIN_SPEECH_MS) {
        setError('That was too quick — press stop once you have finished speaking.');
        setPhase('error');
        return;
      }
      // Only when the meter actually ran. A browser that refuses to start an
      // audio context is not a microphone that heard nothing, and blaming the
      // visitor's hardware for it sends them to fix something that works.
      if (meterReadRef.current && !lastLoudAtRef.current) {
        setError('Your microphone did not pick up any sound. Check that it is not muted and that the right microphone is selected, then try again.');
        setPhase('error');
        return;
      }
      if (blob.size < MIN_AUDIO_BYTES) {
        setError("We couldn't hear anything. Try again and speak a little closer to the microphone.");
        setPhase('error');
        return;
      }

      const form = new FormData();
      form.set('audio', blob, `problem.${type.includes('mp4') ? 'mp4' : 'webm'}`);
      search(form);
    };

    // A chunk a second rather than one at the end. Some browsers hand back
    // nothing at all when a recording is stopped inside their first internal
    // flush, and a clip that arrives in pieces also survives a tab closing
    // mid-sentence better than one that never left the encoder.
    recorder.start(1000);
    startedAtRef.current = Date.now();
    watchLevel(stream);
    setSeconds(0);
    setPhase('recording');

    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setSeconds((s) => {
        // Stops itself at the limit rather than letting someone talk into a
        // recording that will be refused.
        if (s + 1 >= MAX_RECORDING_SECONDS) stopRecording();
        return s + 1;
      });
    }, 1000);
  }, [releaseMic, search, stopRecording, watchLevel]);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    releaseMic();
    resetAll();
  }, [releaseMic, resetAll]);

  const answerCity = useCallback(() => {
    const city = cityAnswer.trim();
    if (!city || !result?.transcript) return;
    search({ transcript: result.transcript, city });
  }, [cityAnswer, result, search]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tell us your legal problem"
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:max-w-3xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-ink/8 bg-gradient-to-r from-primary to-primary-dark px-5 py-4 text-white sm:px-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15">
              <Sparkles className="h-4.5 w-4.5 text-accent" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold leading-tight sm:text-lg">
                Tell us your legal problem
              </h2>
              <p className="mt-0.5 text-[12px] leading-snug text-white/70">
                Speak in Hindi or English — we&apos;ll find the right lawyers for you.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {phase === 'idle' && <Idle onStart={startRecording} />}

          {phase === 'permission' && (
            <Waiting label={PROGRESS.permission} hint="Your browser will ask for permission to use the microphone." />
          )}

          {phase === 'recording' && (
            <Recording
              seconds={seconds}
              level={level}
              peak={peak}
              heard={heardSpeech}
              onStop={stopRecording}
              onCancel={cancelRecording}
            />
          )}

          {phase === 'working' && <Waiting label={PROGRESS[stage]} hint="This usually takes a few seconds." />}

          {phase === 'error' && <ErrorState message={error} onRetry={startRecording} onClose={onClose} />}

          {(phase === 'results' || phase === 'empty') && result && (
            <Results
              data={result}
              empty={phase === 'empty'}
              cityAnswer={cityAnswer}
              onCityAnswer={setCityAnswer}
              onAskAgain={startRecording}
              onSubmitCity={answerCity}
            />
          )}
        </div>

        <p className="border-t border-ink/8 bg-bg/60 px-5 py-2.5 text-[11px] leading-snug text-ink/45 sm:px-6">
          {DISCLAIMER}
        </p>
      </div>
    </div>,
    document.body
  );
}

/* ── States ──────────────────────────────────────────────────────────────── */

function Idle({ onStart }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <button
        type="button"
        onClick={onStart}
        className="group grid h-24 w-24 place-items-center rounded-full bg-gradient-to-b from-primary to-primary-dark text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
        aria-label="Start recording"
      >
        <Mic className="h-9 w-9" aria-hidden="true" />
      </button>
      <p className="mt-4 font-display text-lg font-bold text-ink">Tap and start speaking</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink/60">
        For example: &ldquo;Meri company mujhe teen mahine se salary nahi de rahi hai, mujhe lawyer
        chahiye.&rdquo;
      </p>
      <p className="mt-3 text-[11px] text-ink/40">
        Recording stops on its own when you finish · up to {MAX_RECORDING_SECONDS} seconds
      </p>
    </div>
  );
}

function Waiting({ label, hint }) {
  return (
    <div className="flex flex-col items-center py-10 text-center" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <p className="mt-4 font-display text-base font-semibold text-ink">{label}</p>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}

function Recording({ seconds, level, peak, heard, onStop, onCancel }) {
  const nearLimit = seconds >= WARN_AT_SECONDS;
  // Nothing has reached the microphone in the first few seconds: say so while
  // there is still time to do something about it, not after the fact. Judged
  // on the loudest moment so far, never on the current one — the pauses in
  // ordinary speech are silent, and warning during them told people their
  // microphone was dead while they were mid-sentence.
  const silent = seconds >= 3 && peak < 0.02;
  return (
    <div className="flex flex-col items-center py-6 text-center" aria-live="polite">
      <div className="relative grid h-24 w-24 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
        <span className="absolute inset-2 animate-pulse rounded-full bg-red-500/15" />
        <span className="relative grid h-20 w-20 place-items-center rounded-full bg-red-600 text-white shadow-lg">
          <Mic className="h-8 w-8" aria-hidden="true" />
        </span>
      </div>

      <p className="mt-4 font-display text-2xl font-bold tabular-nums text-ink">{clock(seconds)}</p>
      {/* Proof that the microphone is live. Bars that move answer "is this
          thing on?" better than any wording could. */}
      <div className="mt-3 flex h-6 items-center justify-center gap-1" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => {
          const spread = 1 - (Math.abs(i - 4) / 4) * 0.55;
          const height = Math.max(4, Math.min(24, level * 90 * spread + 4));
          return (
            <span
              key={i}
              className={`w-1.5 rounded-full transition-all duration-75 ${silent ? 'bg-ink/15' : 'bg-primary'}`}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

      <p className={`mt-1 text-sm font-medium ${nearLimit || silent ? 'text-red-600' : 'text-ink/60'}`}>
        {silent
          ? 'No sound is reaching the microphone — check that it is not muted'
          : nearLimit
            ? `Wrapping up in ${MAX_RECORDING_SECONDS - seconds}s — press stop when you're done`
            : heard
              ? 'Listening… it stops on its own when you finish'
              : PROGRESS.recording}
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onStop}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-primary-dark"
        >
          <Square className="h-4 w-4 fill-current" aria-hidden="true" />
          Stop recording
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/30 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry, onClose }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-600">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink/75">{message}</p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink/70 hover:border-ink/30"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Chip({ icon: Icon, children, tone = 'bg-primary/8 text-primary' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${tone}`}>
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}

function Results({ data, empty, cityAnswer, onCityAnswer, onAskAgain, onSubmitCity }) {
  const analysis = data.legal_analysis || {};
  const relaxed = data.relaxed || [];

  return (
    <div>
      {/* What we heard — shown back, because a wrong transcript is the one
          thing the visitor can see is wrong and correct by trying again. */}
      <div className="rounded-2xl border border-ink/8 bg-bg/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">You said</p>
        <p className="mt-1 text-sm italic leading-relaxed text-ink/80">&ldquo;{data.transcript}&rdquo;</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {analysis.category && <Chip icon={Sparkles}>{analysis.category}</Chip>}
          {analysis.issue && <Chip tone="bg-ink/6 text-ink/70">{analysis.issue}</Chip>}
          {analysis.location && <Chip icon={MapPin} tone="bg-emerald-500/10 text-emerald-700">{analysis.location}</Chip>}
          {analysis.urgency === 'high' && (
            <Chip tone="bg-red-500/10 text-red-600">Urgent</Chip>
          )}
        </div>
      </div>

      {/* The one follow-up question worth asking. */}
      {data.follow_up && (
        <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/8 p-4">
          <p className="text-sm font-semibold text-ink">{data.follow_up.question}</p>
          <div className="mt-2.5 flex gap-2">
            <input
              value={cityAnswer}
              onChange={(e) => onCityAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmitCity()}
              placeholder="e.g. Gurgaon"
              className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary/40"
            />
            <button
              type="button"
              onClick={onSubmitCity}
              disabled={!cityAnswer.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </button>
          </div>
        </div>
      )}

      {/* Honest about a widened search rather than quietly showing the wrong
          city's lawyers. */}
      {!empty && (relaxed.length > 0 || data.topped_up) && (
        <p className="mt-4 rounded-xl bg-amber-500/10 px-3.5 py-2.5 text-[12.5px] text-amber-800">
          {relaxed.includes('city') && analysis.location
            ? `We could not find a match in ${analysis.location}, so these are lawyers from across India.`
            : relaxed.length > 0
              ? 'We widened the search to show you the closest matches.'
              : analysis.location
                ? `Closest matches in ${analysis.location} first, then lawyers from elsewhere in India.`
                : 'The closest matches are first, then other lawyers who can help.'}
        </p>
      )}

      {empty ? (
        <div className="py-10 text-center">
          <p className="font-display text-base font-semibold text-ink">
            No lawyer matched that closely enough.
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink/60">
            Try saying a little more about the problem, or browse the directory and filter it
            yourself.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={onAskAgain}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
            >
              <Mic className="h-4 w-4" aria-hidden="true" />
              Record again
            </button>
            {/* Through next/link, not a bare anchor: the directory is a route
                of this app, and a full page load here would throw away the
                recording and the results the visitor is looking at. */}
            <Link
              href="/lawyers"
              className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink/70 hover:border-ink/30"
            >
              Browse lawyers
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 flex items-center justify-between gap-3">
            <h3 className="font-display text-base font-bold text-ink">
              {data.lawyers.length} lawyer{data.lawyers.length === 1 ? '' : 's'} for you
            </h3>
            <button
              type="button"
              onClick={onAskAgain}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:underline"
            >
              <Mic className="h-3.5 w-3.5" aria-hidden="true" />
              Ask again
            </button>
          </div>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {data.lawyers.map((lawyer) => (
              <div key={lawyer._id || lawyer.legalCareId} className="flex flex-col">
                <AdvocateGridCard advocate={lawyer} />
                {/* Why this lawyer — built on the server from the facts the
                    ranking actually used, never written by the model. */}
                {lawyer.match?.reason && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-primary/5 px-3 py-2 text-[12px] leading-snug text-ink/70">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    <span>
                      <span className="font-semibold text-ink/80">Why this lawyer? </span>
                      {lawyer.match.reason}
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
