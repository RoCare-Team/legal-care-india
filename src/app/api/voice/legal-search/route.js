import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { transcribeAudio, TranscriptionError, sttProvider } from '@/lib/ai/transcribe';
import { extractLegalIntent, IntentError, intentProvider } from '@/lib/ai/legalIntent';
import { findLawyersForIntent } from '@/lib/voiceMatch';
import { checkVoiceRateLimit } from '@/lib/voiceRateLimit';
import { DISCLAIMER, MAX_AUDIO_BYTES } from '@/constants/voiceSearch';

/**
 * POST /api/voice/legal-search — "tell us your problem" in one request.
 *
 * Two ways in, because the flow has two steps:
 *
 *   multipart/form-data  audio=<clip>            the spoken problem
 *   application/json     { transcript, city? }   the follow-up answer, or a
 *                                                typed retry — no audio, so no
 *                                                speech bill a second time
 *
 * The pipeline is speech → text → structured intent → the directory's own
 * search. Only the transcript ever reaches a model; the lawyer database never
 * does. See lib/ai/legalIntent for why that split matters.
 *
 * Open to signed-out visitors on purpose: someone whose salary has not been
 * paid for three months should not have to make an account before finding out
 * that we have lawyers for it. What stops that being expensive is the rate
 * limit, the one-minute cap on the clip, and a model prompt of a few hundred
 * tokens.
 */

export const dynamic = 'force-dynamic';
// Whisper on a minute of audio plus a small model call: comfortably inside
// this, and far enough under a platform's own ceiling to fail cleanly.
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };

/** The caller, for the rate limit: the account if signed in, else the IP. */
function callerOf(request, session) {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || '';
  return { userId: session?.role === 'user' ? session.id : '', ip };
}

function fail(message, status = 400, extra = {}) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status, headers: NO_STORE });
}

export async function POST(request) {
  // Nothing configured — say so once, clearly, rather than letting every
  // request fail deeper in with a vaguer message.
  if (!sttProvider() || !intentProvider()) {
    return fail('Voice search is not switched on for this site yet.', 503, { code: 'not_configured' });
  }

  const session = await getSession().catch(() => null);
  const caller = callerOf(request, session);

  const limit = await checkVoiceRateLimit(caller);
  if (!limit.ok) {
    return NextResponse.json(
      {
        success: false,
        error: 'You have used voice search a few times just now. Please try again a little later.',
        code: 'rate_limited',
      },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const contentType = request.headers.get('content-type') || '';

  let transcript = '';
  let cityAnswer = '';
  let transcribedBy = '';

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('audio');
      if (!file || typeof file === 'string') return fail('No recording was sent.', 400);
      if (file.size > MAX_AUDIO_BYTES) {
        return fail('That recording is too long. Please keep it under a minute.', 413);
      }

      cityAnswer = String(form.get('city') || '').trim().slice(0, 60);
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await transcribeAudio(buffer, file.type);
      transcript = result.text;
      transcribedBy = result.provider;
    } else {
      const body = await request.json().catch(() => ({}));
      transcript = String(body?.transcript || '').trim().slice(0, 2000);
      cityAnswer = String(body?.city || '').trim().slice(0, 60);
      if (!transcript) return fail('Tell us what the problem is.', 400);
    }

    const { intent, provider: analysedBy } = await extractLegalIntent(transcript);

    // A city typed in answer to the follow-up wins over anything heard in the
    // recording: it is the more recent and more deliberate answer.
    const { lawyers, city, cityLabel, relaxed, toppedUp, totalMatched } = await findLawyersForIntent(intent, {
      cityOverride: cityAnswer,
    });

    // Ask for the city only when it would actually change the answer: nobody
    // was named, we could not resolve one, and there are lawyers to narrow.
    const askCity = !cityLabel && lawyers.length > 0;

    return NextResponse.json(
      {
        success: true,
        transcript,
        legal_analysis: {
          category: intent.category || null,
          issue: intent.issue,
          sub_issue: intent.sub_issue || null,
          specialization: intent.specialization,
          keywords: intent.keywords,
          location: cityLabel || null,
          urgency: intent.urgency,
          summary: intent.summary,
        },
        follow_up: askCity
          ? {
            field: 'city',
            question: intent.followUpQuestion || 'Which city do you need the lawyer in?',
          }
          : null,
        // Which parts of the search had to be widened to find anyone, so the
        // screen can say "no one in Gurgaon for this — here are lawyers across
        // India" instead of quietly showing the wrong thing.
        relaxed,
        topped_up: toppedUp,
        total_matched: totalMatched,
        lawyers,
        disclaimer: DISCLAIMER,
        // Handy while tuning; harmless to expose — it names the model, not the
        // key, and says nothing about any lawyer or client.
        meta: { transcribed_by: transcribedBy || null, analysed_by: analysedBy },
      },
      { headers: NO_STORE }
    );
  } catch (err) {
    if (err instanceof TranscriptionError || err instanceof IntentError) {
      return fail(err.message, err.status, { code: err.code });
    }
    console.error('POST /api/voice/legal-search', err);
    return fail('Something went wrong. Please try again.', 500);
  }
}
