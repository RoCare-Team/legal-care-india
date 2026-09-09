import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { getRawAdvocateById } from '@/lib/advocates';

export const dynamic = 'force-dynamic';

const MODEL = process.env.OPENAI_ABOUT_MODEL || 'gpt-4o-mini';

/**
 * POST /api/dashboard/about/generate
 *
 * Drafts the "About" paragraph for the signed-in lawyer from what is already
 * on their profile, and returns it. Nothing is written to the database — the
 * lawyer reads the draft, edits it, and saves it themselves. A public claim
 * about someone's practice should not appear on their profile because a
 * machine decided it while they were looking elsewhere.
 *
 * The facts come from their own record and nothing else. The model is asked to
 * summarise, not to research: it never sees a name to look up, and it is told
 * in the prompt that inventing a credential is the one unacceptable outcome.
 * A profile that claims a bar-council standing, a win rate or an award that
 * does not exist is worse for the lawyer than an empty box.
 */

/** Only the fields worth summarising, and only the ones actually filled in. */
function factsFrom(a) {
  const clean = (v) => String(v ?? '').trim();
  const list = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

  const facts = {};
  if (clean(a.city)) facts.city = clean(a.city);
  if (clean(a.state)) facts.state = clean(a.state);
  if (list(a.specializations).length) facts.practiceAreas = list(a.specializations);
  if (list(a.subSpecializations).length) facts.matters = list(a.subSpecializations);
  if (list(a.courts).length) facts.courts = list(a.courts);
  if (list(a.languages).length) facts.languages = list(a.languages);
  if (Number(a.experience) > 0) facts.yearsOfExperience = Number(a.experience);
  if (list(a.education).length) {
    facts.education = list(a.education)
      .map((e) => [e?.degree, e?.institute].filter(Boolean).join(', '))
      .filter(Boolean);
  }
  const otherCities = list(a.practiceCities).filter(
    (c) => clean(c).toLowerCase() !== clean(a.city).toLowerCase()
  );
  if (otherCities.length) facts.alsoPractisesIn = otherCities;
  return facts;
}

const SYSTEM = [
  'You write the "About" section of a lawyer\'s profile on an Indian legal directory.',
  '',
  'Rules, in order of importance:',
  '1. Use ONLY the facts given. Never invent or imply anything not in them —',
  '   no awards, no case counts, no success rates, no client numbers, no years',
  '   of experience, no court, no qualification, no specialisation. If a fact',
  '   is absent, write as though it does not exist rather than guessing.',
  '2. Third person, using "the advocate" or the practice areas as the subject.',
  '   Do not use the lawyer\'s name — it is printed directly above this text.',
  '3. 90 to 130 words, two short paragraphs.',
  '4. Plain, professional Indian English. No marketing superlatives',
  '   ("best", "leading", "renowned", "top-rated"), no promises about outcomes,',
  '   and nothing that reads as legal advice or a guarantee.',
  '5. Mention the city and the main practice areas early — this text is indexed',
  '   by search engines and read by clients deciding whom to call.',
  '6. Return the paragraphs as plain text. No headings, no markdown, no quotes.',
].join('\n');

export async function POST() {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'Drafting is not switched on for this site yet.' },
      { status: 503 }
    );
  }

  try {
    const advocate = await getRawAdvocateById(id);
    if (!advocate) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    const facts = factsFrom(advocate);
    // A paragraph built from a city alone would be padding, and padding on a
    // public profile is what invention looks like from the outside.
    if (!facts.practiceAreas?.length || !facts.city) {
      return NextResponse.json(
        {
          error:
            'Add at least one practice area and your city first — there is nothing to summarise yet.',
        },
        { status: 400 }
      );
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 400,
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: `Facts about this advocate:\n${JSON.stringify(facts, null, 2)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('about/generate: openai refused', res.status, detail.slice(0, 300));
      return NextResponse.json(
        { error: 'Could not write a draft just now. Please try again.' },
        { status: 502 }
      );
    }

    const payload = await res.json();
    const about = String(payload?.choices?.[0]?.message?.content || '').trim();
    if (!about) {
      return NextResponse.json(
        { error: 'Could not write a draft just now. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ about, model: MODEL });
  } catch (err) {
    console.error('about/generate error', err);
    return NextResponse.json(
      { error: 'Could not write a draft just now. Please try again.' },
      { status: 502 }
    );
  }
}
