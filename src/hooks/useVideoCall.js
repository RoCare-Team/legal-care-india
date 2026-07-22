'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useVideoCall — the WebRTC engine behind the video call inside a live
 * consultation.
 *
 * The two browsers stream directly to each other; the server only relays the
 * handshake. Because the rest of the app is poll-based (no websockets), so is
 * the signalling: once a call is up we poll /api/consultations/[id]/call every
 * second for the other side's description and ICE candidates. While idle we
 * poll nothing — the ordinary 2s chat poll already carries `session.call`,
 * which is what makes the lawyer's phone ring.
 *
 * Direction matches the booking: the client rings, the lawyer accepts.
 *
 * Phases:
 *   idle       nothing happening
 *   calling    client rang, waiting for the lawyer  (client only)
 *   incoming   the lawyer is being rung             (lawyer only)
 *   connecting accepted; media still negotiating
 *   connected  both streams flowing
 *   ended      just finished — shows why, then falls back to idle
 */

const POLL_MS = 1000;

/**
 * Capture settings.
 *
 * Video is deliberately asked for at 640×360 / 24fps, not 720p. On a typical
 * Indian mobile uplink a 720p stream eats the whole pipe, audio packets start
 * queueing behind video frames, and the far end hears the hiss-and-stutter that
 * lossy Opus produces. Voice is what a legal consultation actually runs on, so
 * video gets the leftovers, not the other way round.
 *
 * Audio asks for mono at 48 kHz with the full browser cleanup chain on. Every
 * value is `ideal`, never exact — an unmet exact constraint throws
 * OverconstrainedError and the call would fail to start at all.
 */
const MEDIA = {
  video: {
    facingMode: 'user',
    width: { ideal: 640 },
    height: { ideal: 360 },
    frameRate: { ideal: 24, max: 30 },
  },
  audio: {
    echoCancellation: true,   // kills the far end's voice looping back through the speaker
    noiseSuppression: true,   // kills steady fan / traffic / line hiss
    autoGainControl: true,    // keeps a soft speaker audible without manual gain
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 48000 },
  },
};

// Send-side caps. Audio is tiny and must never be starved; video takes what is
// left. 600 kbps is plenty for a talking head at 360p.
const VIDEO_MAX_BITRATE = 600_000;
const AUDIO_MAX_BITRATE = 40_000;

/**
 * Merge our Opus preferences into the SDP's fmtp line for the Opus payload.
 *
 * Chrome's default is `minptime=10;useinbandfec=1`, which leaves the codec free
 * to run in stereo at a low average bitrate — wasteful for one voice, and the
 * first thing to sound rough when packets drop. We pin it to mono, keep
 * in-band FEC on (lost packets get reconstructed instead of clicking), and hold
 * DTX off so the line never cuts to comfort noise mid-sentence.
 *
 * Parsed and re-emitted rather than string-appended, so nothing is duplicated
 * if the browser already set a key.
 */
function withOpusParams(sdp) {
  const rtpmap = sdp.match(/a=rtpmap:(\d+) opus\/48000/i);
  if (!rtpmap) return sdp;
  const pt = rtpmap[1];

  const wanted = {
    minptime: '10',
    useinbandfec: '1',
    usedtx: '0',
    stereo: '0',
    'sprop-stereo': '0',
    maxaveragebitrate: '32000',
    maxplaybackrate: '48000',
  };

  const fmtpLine = new RegExp(`^a=fmtp:${pt} (.*)$`, 'm');
  const existing = sdp.match(fmtpLine);

  const params = {};
  if (existing) {
    for (const pair of existing[1].split(';')) {
      const [k, v] = pair.split('=');
      if (k?.trim()) params[k.trim()] = (v ?? '').trim();
    }
  }
  Object.assign(params, wanted);

  const merged = Object.entries(params)
    .map(([k, v]) => (v === '' ? k : `${k}=${v}`))
    .join(';');

  if (existing) return sdp.replace(fmtpLine, `a=fmtp:${pt} ${merged}`);
  return sdp.replace(
    new RegExp(`^(a=rtpmap:${pt} opus/48000.*)$`, 'm'),
    `$1\r\na=fmtp:${pt} ${merged}`
  );
}

/**
 * Cap what we send, and tell the browser audio matters more than video.
 * Best-effort throughout — `setParameters` support varies by browser, and a
 * refused tweak should never take the call down with it.
 */
async function tuneSenders(pc) {
  for (const sender of pc.getSenders()) {
    if (!sender.track) continue;
    try {
      const params = sender.getParameters();
      if (!params.encodings?.length) params.encodings = [{}];

      if (sender.track.kind === 'video') {
        params.encodings[0].maxBitrate = VIDEO_MAX_BITRATE;
        params.encodings[0].maxFramerate = 24;
        // Under strain, drop frames rather than turn the picture to mush.
        params.degradationPreference = 'balanced';
      } else {
        params.encodings[0].maxBitrate = AUDIO_MAX_BITRATE;
        params.encodings[0].networkPriority = 'high';
        params.encodings[0].priority = 'high';
      }

      await sender.setParameters(params);
    } catch {
      /* browser refused the tweak — the call still works, just untuned */
    }
  }
}

// How long a 'disconnected' peer gets to come back before we give up. Covers
// the other side closing their laptop or losing signal mid-call.
const RECONNECT_GRACE_MS = 15000;

/** Human wording for why a call stopped. */
function endMessage(reason, endedBy, viewerRole, hasTurn = true) {
  if (reason === 'rejected') return 'The lawyer declined the video call.';
  if (reason === 'unanswered') return 'No answer.';
  if (reason === 'session-ended') return 'The consultation time is over.';
  if (reason === 'failed') {
    // Without a TURN relay, mobile-data callers ring fine but can never
    // connect — worth saying so instead of a vague "connection dropped".
    return hasTurn
      ? 'The connection dropped. Please check your network and try again.'
      : 'Could not connect. This usually happens on mobile data — try Wi-Fi, or ask support to enable a TURN relay.';
  }
  if (reason === 'hangup') {
    return endedBy && endedBy !== viewerRole ? 'The other side ended the call.' : 'Call ended.';
  }
  return 'Call ended.';
}

/** Friendly text for a getUserMedia rejection. */
function mediaError(err) {
  const name = err?.name || '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera and microphone access was blocked. Allow it in your browser settings and try again.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No camera or microphone was found on this device.';
  }
  if (name === 'NotReadableError') {
    return 'Your camera is already in use by another app.';
  }
  return 'Could not start your camera. Please try again.';
}

export default function useVideoCall({ sessionId, viewerRole, call, sessionActive }) {
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState('');
  const [endNote, setEndNote] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteLive, setRemoteLive] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [busy, setBusy] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const facingRef = useRef('user');

  const callIdRef = useRef('');
  const cursorRef = useRef(0);
  const pendingIceRef = useRef([]);
  const remoteDescSetRef = useRef(false);
  const answeredRef = useRef(false);
  const phaseRef = useRef('idle');
  const hasTurnRef = useRef(true);
  const dropTimerRef = useRef(null);

  phaseRef.current = phase;
  const isClient = viewerRole === 'user';

  /* ── plumbing ─────────────────────────────────────────────────────────── */

  const post = useCallback(
    async (body) => {
      const res = await fetch(`/api/consultations/${sessionId}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, ...data };
    },
    [sessionId]
  );

  /** Drop the peer connection and release the camera. Safe to call twice. */
  const teardown = useCallback(() => {
    if (dropTimerRef.current) {
      clearTimeout(dropTimerRef.current);
      dropTimerRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      try { pcRef.current.close(); } catch { /* already closed */ }
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    cursorRef.current = 0;
    pendingIceRef.current = [];
    remoteDescSetRef.current = false;
    answeredRef.current = false;
    setRemoteLive(false);
    setReconnecting(false);
    setMicOn(true);
    setCamOn(true);
  }, []);

  /** Wind the call down locally and show why. */
  const finish = useCallback(
    (reason, endedBy = '') => {
      teardown();
      setEndNote(endMessage(reason, endedBy, viewerRole, hasTurnRef.current));
      setPhase('ended');
    },
    [teardown, viewerRole]
  );

  /** Build the peer connection, wired to trickle ICE through the API. */
  const createPeer = useCallback(async () => {
    const res = await fetch('/api/webrtc/ice', { cache: 'no-store' });
    const { iceServers = [], hasTurn = false } = await res.json().catch(() => ({}));
    hasTurnRef.current = hasTurn;

    const pc = new RTCPeerConnection({ iceServers, iceCandidatePoolSize: 4 });
    const remote = new MediaStream();
    remoteStreamRef.current = remote;

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      post({
        action: 'signal',
        callId: callIdRef.current,
        candidate: JSON.stringify(e.candidate.toJSON()),
      }).catch(() => { /* a lost candidate just costs one route */ });
    };

    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((t) => {
        if (!remote.getTracks().includes(t)) remote.addTrack(t);
      });
      setRemoteLive(true);
    };

    const giveUp = () => {
      post({ action: 'end', reason: 'failed' }).catch(() => {});
      finish('failed');
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;

      // Recovered — cancel any pending give-up.
      if (state === 'connected') {
        if (dropTimerRef.current) {
          clearTimeout(dropTimerRef.current);
          dropTimerRef.current = null;
        }
        setReconnecting(false);
        setPhase('connected');
        return;
      }

      // The other side went quiet — their tab closed, or their signal dropped.
      // Give them a moment to come back before ending the call for both.
      if (state === 'disconnected') {
        setReconnecting(true);
        if (!dropTimerRef.current) {
          dropTimerRef.current = setTimeout(giveUp, RECONNECT_GRACE_MS);
        }
        return;
      }

      if (state === 'failed') giveUp();
    };

    pcRef.current = pc;
    return pc;
  }, [post, finish]);

  /** Grab the camera + mic and attach them to the peer connection. */
  const attachLocalMedia = useCallback(async (pc) => {
    const stream = await navigator.mediaDevices.getUserMedia(MEDIA);
    localStreamRef.current = stream;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }, []);

  /* ── actions ──────────────────────────────────────────────────────────── */

  /** Client rings the lawyer. */
  const start = useCallback(async () => {
    if (!isClient || busy || phaseRef.current !== 'idle') return;
    setBusy(true);
    setError('');
    setEndNote('');
    try {
      const res = await post({ action: 'start' });
      if (!res.ok) {
        setError(res.error || 'Could not start the video call.');
        return;
      }
      callIdRef.current = res.call.id;
      cursorRef.current = 0;
      setPhase('calling');

      const pc = await createPeer();
      await attachLocalMedia(pc);
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription({ type: offer.type, sdp: withOpusParams(offer.sdp) });
      await tuneSenders(pc);
      await post({
        action: 'signal',
        callId: callIdRef.current,
        offer: JSON.stringify(pc.localDescription),
      });
    } catch (err) {
      // Most often: the user denied the camera prompt. Cancel the ring so the
      // lawyer's phone isn't left buzzing for a call we can't make.
      await post({ action: 'end' }).catch(() => {});
      teardown();
      setPhase('idle');
      setError(mediaError(err));
    } finally {
      setBusy(false);
    }
  }, [isClient, busy, post, createPeer, attachLocalMedia, teardown]);

  /** Lawyer accepts the ring — media starts, the poll finishes the handshake. */
  const accept = useCallback(async () => {
    if (isClient || busy || phaseRef.current !== 'incoming') return;
    setBusy(true);
    setError('');
    try {
      const pc = await createPeer();
      await attachLocalMedia(pc);
      const res = await post({ action: 'accept' });
      if (!res.ok) {
        teardown();
        setPhase('idle');
        setError(res.error || 'Could not join the call.');
        return;
      }
      setPhase('connecting');
    } catch (err) {
      await post({ action: 'reject' }).catch(() => {});
      teardown();
      setPhase('idle');
      setError(mediaError(err));
    } finally {
      setBusy(false);
    }
  }, [isClient, busy, createPeer, attachLocalMedia, post, teardown]);

  /** Lawyer declines the ring. */
  const reject = useCallback(async () => {
    if (isClient) return;
    setPhase('idle');
    teardown();
    await post({ action: 'reject' }).catch(() => {});
  }, [isClient, post, teardown]);

  /** Either side hangs up (also used by the caller to cancel a ring). */
  const end = useCallback(async () => {
    await post({ action: 'end' }).catch(() => {});
    finish('hangup', viewerRole);
  }, [post, finish, viewerRole]);

  /** Dismiss the "call ended" card and go back to the chat. */
  const dismiss = useCallback(() => {
    setEndNote('');
    setPhase('idle');
  }, []);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, []);

  const toggleCam = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  }, []);

  /** Swap between the front and rear camera without renegotiating. */
  const flipCamera = useCallback(async () => {
    const pc = pcRef.current;
    const stream = localStreamRef.current;
    if (!pc || !stream) return;

    const next = facingRef.current === 'user' ? 'environment' : 'user';
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({
        video: { ...MEDIA.video, facingMode: next },
        audio: false,
      });
      const newTrack = fresh.getVideoTracks()[0];
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (!sender || !newTrack) {
        fresh.getTracks().forEach((t) => t.stop());
        return;
      }
      await sender.replaceTrack(newTrack);

      const oldTrack = stream.getVideoTracks()[0];
      if (oldTrack) { stream.removeTrack(oldTrack); oldTrack.stop(); }
      stream.addTrack(newTrack);
      newTrack.enabled = camOn;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      facingRef.current = next;
      // A replaced track can come back at the browser's default bitrate.
      await tuneSenders(pc);
    } catch {
      /* no second camera — stay on the current one */
    }
  }, [camOn]);

  /* ── incoming ring, from the ordinary chat poll ───────────────────────── */

  useEffect(() => {
    if (isClient || !call) return;
    if (call.status === 'ringing' && phaseRef.current === 'idle') {
      callIdRef.current = call.id;
      cursorRef.current = 0;
      setEndNote('');
      setPhase('incoming');
    } else if (call.status !== 'ringing' && phaseRef.current === 'incoming') {
      // The client hung up (or it rang out) before we picked up.
      setPhase('idle');
    }
  }, [isClient, call?.status, call?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── signalling poll (only while a call is actually up) ───────────────── */

  const signalling = phase === 'calling' || phase === 'connecting' || phase === 'connected';

  useEffect(() => {
    if (!signalling || !sessionId) return undefined;
    let alive = true;

    const tick = async () => {
      let state;
      try {
        const res = await fetch(
          `/api/consultations/${sessionId}/call?since=${cursorRef.current}`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        state = await res.json();
      } catch {
        return; // transient — the next tick retries
      }
      if (!alive) return;

      const remote = state.call || {};
      // A newer call started elsewhere (another tab) — this one is stale.
      if (remote.id && callIdRef.current && remote.id !== callIdRef.current) {
        finish('hangup');
        return;
      }
      if (remote.status === 'ended' || remote.status === 'idle') {
        finish(remote.endedReason || 'hangup', remote.endedBy);
        return;
      }

      const pc = pcRef.current;
      if (!pc) return;

      try {
        // Lawyer: the client's offer arrived — answer it.
        if (!isClient && remote.offer && !answeredRef.current) {
          answeredRef.current = true;
          await pc.setRemoteDescription(JSON.parse(remote.offer));
          remoteDescSetRef.current = true;
          const answer = await pc.createAnswer();
          await pc.setLocalDescription({ type: answer.type, sdp: withOpusParams(answer.sdp) });
          await tuneSenders(pc);
          await post({
            action: 'signal',
            callId: callIdRef.current,
            answer: JSON.stringify(pc.localDescription),
          });
        }

        // Client: the lawyer's answer arrived — the handshake completes.
        if (isClient && remote.answer && !remoteDescSetRef.current) {
          await pc.setRemoteDescription(JSON.parse(remote.answer));
          remoteDescSetRef.current = true;
        }

        // ICE can arrive before the description; hold it until we can use it.
        for (const raw of state.candidates || []) {
          if (remoteDescSetRef.current) {
            await pc.addIceCandidate(JSON.parse(raw)).catch(() => {});
          } else {
            pendingIceRef.current.push(raw);
          }
        }
        if (remoteDescSetRef.current && pendingIceRef.current.length) {
          const queued = pendingIceRef.current;
          pendingIceRef.current = [];
          for (const raw of queued) {
            await pc.addIceCandidate(JSON.parse(raw)).catch(() => {});
          }
        }
        cursorRef.current = state.nextSince ?? cursorRef.current;
      } catch (err) {
        console.error('call signalling failed', err);
      }
    };

    tick();
    const t = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [signalling, sessionId, isClient, post, finish]);

  /* ── the call can never outlive the consultation ──────────────────────── */

  useEffect(() => {
    if (sessionActive) return;
    if (phaseRef.current !== 'idle' && phaseRef.current !== 'ended') {
      finish('session-ended');
    }
  }, [sessionActive, finish]);

  // Attach streams whenever the video elements mount into a new phase.
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [phase, remoteLive]);

  // Release the camera if the component unmounts mid-call.
  useEffect(() => teardown, [teardown]);

  return {
    phase,
    error,
    endNote,
    busy,
    micOn,
    camOn,
    remoteLive,
    reconnecting,
    localVideoRef,
    remoteVideoRef,
    // Only the client rings, and only inside a live consultation.
    canStart: isClient && sessionActive && phase === 'idle',
    start,
    accept,
    reject,
    end,
    dismiss,
    toggleMic,
    toggleCam,
    flipCamera,
    clearError: () => setError(''),
  };
}
