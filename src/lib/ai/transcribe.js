import {
  ACCEPTED_AUDIO_TYPES, MAX_AUDIO_BYTES, MIN_AUDIO_BYTES,
} from '@/constants/voiceSearch';

/**
 * Speech to text, behind one function.
 *
 * The rest of the feature calls `transcribeAudio(...)` and never learns which
 * service answered. That is deliberate: speech APIs are the part of this
 * pipeline most likely to be swapped — for price, for accuracy on Hindi and
 * Hinglish, or because a provider has an outage — and a swap should be one
 * environment variable, not a change anywhere else in the codebase.
 *
 * Providers are chosen with VOICE_STT_PROVIDER:
 *   openai    (default) — Whisper. Uses the OPENAI_API_KEY this site already
 *                         has for AI avatars, so nothing new has to be signed
 *                         up for. Handles Hindi, English and the mix of both
 *                         that people actually speak.
 *   deepgram            — DEEPGRAM_API_KEY. Cheaper per minute and faster;
 *                         'nova-2' with language=hi handles Hinglish well.
 *
 * To add another, write one function of the same shape and list it in
 * PROVIDERS. Nothing else changes.
 */

/** A failure the caller can turn into an HTTP status and a plain message. */
export class TranscriptionError extends Error {
  constructor(message, { status = 502, code = 'stt_failed' } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Refuses anything that is not a short clip of audio, before it costs money. */
export function assertUsableAudio(buffer, mimeType) {
  if (!buffer?.length || buffer.length < MIN_AUDIO_BYTES) {
    throw new TranscriptionError('That recording was too short to hear.', {
      status: 400,
      code: 'too_short',
    });
  }
  if (buffer.length > MAX_AUDIO_BYTES) {
    throw new TranscriptionError('That recording is too long. Please keep it under a minute.', {
      status: 413,
      code: 'too_large',
    });
  }
  const type = String(mimeType || '').split(';')[0].trim().toLowerCase();
  if (type && !ACCEPTED_AUDIO_TYPES.includes(type)) {
    throw new TranscriptionError('That audio format is not supported.', {
      status: 415,
      code: 'bad_type',
    });
  }
}

/**
 * Words a caller is likely to use, in both scripts, as a hint to the
 * transcriber. Hindi written in Devanagari here is what nudges Hindi speech
 * back in Devanagari rather than Urdu script, which Whisper otherwise picks
 * about half the time and which the person who spoke it cannot read.
 */
const LEGAL_PROMPT = 'मुझे वकील चाहिए। सैलरी, एफआईआर, जमानत, तलाक, किराया, प्रॉपर्टी, कंपनी, कोर्ट. '
  + 'I need a lawyer for a salary dispute, property case, divorce, FIR, GST notice, rent agreement.';

/**
 * Did the transcriber write the hint back instead of the speech?
 *
 * Judged strictly, by whether the words are literally a piece of the hint —
 * not by how much vocabulary they share with it. A looser test is worse than
 * none: "meri company mujhe salary nahi de rahi, mujhe lawyer chahiye" shares
 * most of its words with a hint about salaries and lawyers, for the obvious
 * reason, and throwing that away is exactly the failure this was meant to
 * prevent.
 */
function looksLikePromptEcho(text) {
  const flatten = (v) => String(v).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const said = flatten(text);
  if (!said) return true;
  // A real sentence is longer than anything the hint could contribute.
  if (said.split(' ').length > 8) return false;
  return flatten(LEGAL_PROMPT).includes(said);
}

/** The file extension a provider needs to see, worked out from the type. */
function extensionFor(mimeType) {
  const type = String(mimeType || '').split(';')[0].trim().toLowerCase();
  return {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mp4': 'mp4',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'aac',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/flac': 'flac',
  }[type] || 'webm';
}

/**
 * OpenAI Whisper.
 *
 * No `language` is pinned. Callers here speak Hindi, English, or both in one
 * sentence ("meri company salary nahi de rahi"), and forcing a language makes
 * Whisper translate rather than transcribe the other one.
 */
async function transcribeWithOpenAI(buffer, mimeType, { signal } = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new TranscriptionError('Voice search is not switched on for this site yet.', {
      status: 503,
      code: 'not_configured',
    });
  }

  const model = process.env.OPENAI_STT_MODEL || 'whisper-1';
  const form = new FormData();
  form.set('file', new Blob([buffer], { type: mimeType || 'audio/webm' }), `speech.${extensionFor(mimeType)}`);
  form.set('model', model);
  // Plain text back: we want the words, not word-level timings we would throw
  // away, and the smaller response is one less thing to parse.
  form.set('response_format', 'text');
  // A sample of the kind of thing being said, which is all Whisper's prompt
  // is for: it biases vocabulary and script without pinning a language, and
  // pinning one would make it translate the other — half of these callers
  // switch between two languages inside a sentence.
  //
  // Deliberately no instruction in it. It used to end with "हिंदी देवनागरी में
  // लिखें।", and on a clip Whisper found hard it wrote that sentence back
  // instead of the speech: an English recording about a landlord came out as
  // "मुंबाई में लिखें।". A prompt is example text to a transcription model, not
  // an order, and anything phrased as an order can be transcribed as if it had
  // been spoken.
  form.set('prompt', LEGAL_PROMPT);

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[voice] openai transcription failed', res.status, detail.slice(0, 400));
    throw new TranscriptionError('Could not read that recording. Please try again.');
  }

  return { text: (await res.text()).trim(), provider: `openai:${model}` };
}

/** Deepgram — same shape, different service. */
async function transcribeWithDeepgram(buffer, mimeType, { signal } = {}) {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    throw new TranscriptionError('Voice search is not switched on for this site yet.', {
      status: 503,
      code: 'not_configured',
    });
  }

  const model = process.env.DEEPGRAM_STT_MODEL || 'nova-2';
  const params = new URLSearchParams({ model, smart_format: 'true', punctuate: 'true', language: 'hi' });
  const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: 'POST',
    headers: { Authorization: `Token ${key}`, 'Content-Type': mimeType || 'audio/webm' },
    body: buffer,
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[voice] deepgram transcription failed', res.status, detail.slice(0, 400));
    throw new TranscriptionError('Could not read that recording. Please try again.');
  }

  const data = await res.json();
  const text = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
  return { text: text.trim(), provider: `deepgram:${model}` };
}

const PROVIDERS = {
  openai: transcribeWithOpenAI,
  deepgram: transcribeWithDeepgram,
};

/** Which provider this deployment uses, and whether it can run at all. */
export function sttProvider() {
  const asked = String(process.env.VOICE_STT_PROVIDER || '').toLowerCase();
  if (asked && PROVIDERS[asked]) return asked;
  // Nothing asked for: use whichever key is present, OpenAI first because the
  // site already has that key for other AI features.
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.DEEPGRAM_API_KEY) return 'deepgram';
  return '';
}

/**
 * Turn a clip of speech into text.
 *
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {Promise<{ text: string, provider: string }>}
 */
export async function transcribeAudio(buffer, mimeType, options = {}) {
  assertUsableAudio(buffer, mimeType);

  const provider = sttProvider();
  if (!provider) {
    throw new TranscriptionError('Voice search is not switched on for this site yet.', {
      status: 503,
      code: 'not_configured',
    });
  }

  const result = await PROVIDERS[provider](buffer, mimeType, options);
  // "Did we hear words?" — counted as letters in ANY script. It used to count
  // Latin and Devanagari only, and threw away perfectly good transcripts the
  // moment Whisper answered in another one: Hindi written in Urdu script,
  // Bengali, Tamil, Gujarati. The result was "we couldn't hear anything" about
  // a recording that had been transcribed correctly.
  const letters = (result.text || '').match(/\p{L}/gu)?.length || 0;
  if (letters < 4 || looksLikePromptEcho(result.text)) {
    // Silence, a cough, or a room the microphone could not hear over. Told
    // apart from a service failure so the visitor is asked to speak again
    // rather than to try again later.
    throw new TranscriptionError("We couldn't hear anything in that recording. Please try again.", {
      status: 422,
      code: 'empty_transcript',
    });
  }
  return result;
}
