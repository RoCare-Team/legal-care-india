/**
 * Play a short two-tone "incoming call" chime using the Web Audio API — no
 * audio file needed. Safe to call repeatedly; silently no-ops if the browser
 * blocks audio (e.g. before the first user interaction).
 */
export function playIncomingChime() {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    const tones = [
      { freq: 880, start: 0, dur: 0.18 },
      { freq: 1174, start: 0.2, dur: 0.22 },
    ];

    tones.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur);
    });

    // Free the context shortly after the chime finishes.
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    /* audio not available — ignore */
  }
}
