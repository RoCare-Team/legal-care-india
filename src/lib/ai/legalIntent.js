import { CATEGORIES, getSubServices } from '@/data/categories';
import { CATEGORY_ALIASES, URGENCY_LEVELS } from '@/constants/voiceSearch';

/**
 * What the AI is for: turning a sentence a worried person said into a
 * structured legal intent. Nothing else.
 *
 * It is never shown the lawyer directory and never asked who to hire. It reads
 * one transcript and answers with a small, fixed JSON object, which this module
 * then validates against the directory's own vocabulary before anything is
 * searched. That split is what makes the feature cheap (one short call over a
 * few hundred tokens), private (no lawyer data leaves the server) and safe (a
 * model cannot invent a lawyer, a specialism or a city that does not exist —
 * anything it invents simply fails to match here and is dropped).
 *
 * Provider is chosen by what is configured:
 *   Anthropic (ANTHROPIC_API_KEY) — preferred; Haiku is plenty for a
 *     classification this small and is the cheapest way to run it.
 *   OpenAI (OPENAI_API_KEY) — the fallback, and the one most sites here will
 *     use, since the key is already present for other AI features.
 */

export class IntentError extends Error {
  constructor(message, { status = 502, code = 'ai_failed' } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

/** Every matter the directory knows, with the area it belongs to. */
const ALL_MATTERS = CATEGORIES.flatMap((c) =>
  getSubServices(c.name).map((m) => ({ matter: m, category: c.name }))
);

/**
 * The matters, written out per area for the prompt.
 *
 * Giving the model the directory's own vocabulary is what makes `sub_issue`
 * usable as a filter. Asked without it, a model describes the problem in its
 * own words — "three months delay", "salary / wage dispute" — and none of
 * those are what a lawyer ticked on their form, so the most specific filter we
 * have goes unused on every search. It costs a few hundred tokens once per
 * call and turns a guess into an exact match.
 */
const MATTER_VOCABULARY = CATEGORIES
  .map((c) => `${c.name}: ${getSubServices(c.name).join(', ')}`)
  .join('\n');

const SYSTEM_PROMPT = `You are a legal intake classifier for an Indian lawyer directory.

You read one description of a person's problem — often in Hindi, English or a mix of both — and return ONLY a JSON object. Never give legal advice, never name a law firm or a lawyer, never say what the outcome of a case would be.

Return exactly this shape:
{
  "legal_category": "one of the practice areas listed below, or null if genuinely unclear",
  "issue": "a short plain-English label for the problem, 2-5 words",
  "sub_issue": "the specific matter, 2-5 words, or null",
  "lawyer_specialization": ["one or two practice areas from the list"],
  "keywords": ["3-6 short search terms in English"],
  "location": "the Indian city the person named, or null",
  "urgency": "low | medium | high",
  "language": "hi | en | hinglish",
  "summary": "one sentence, in the person's own language, describing what they need — no advice",
  "follow_up_question": "one short question if something essential is missing, else null",
  "missing": ["location"]
}

Practice areas (use these exact names): ${CATEGORY_NAMES.join(', ')}.

Specific matters, by area — "sub_issue" MUST be copied exactly from the line of the area you chose, or be null if none of them fit:
${MATTER_VOCABULARY}

Rules:
- Translate the problem into English for "issue", "sub_issue" and "keywords", even when the person spoke Hindi.
- "location" is only a city the person actually named. Never guess one.
- Ask a follow-up question ONLY when the search would be much worse without it — in practice that is the city, and only when they did not say one. One question, under ten words.
- "urgency" is high when someone is in custody, faces an imminent hearing or deadline, or is in danger; low when it is planning or paperwork.
- If the description is not a legal problem at all, set "legal_category" to null and "issue" to "unclear".
- Output the JSON object and nothing else.`;

/** The raw text a model returned, as JSON, whatever it wrapped it in. */
function parseJsonObject(raw) {
  const text = String(raw || '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function askAnthropic(transcript, { signal } = {}) {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_INTENT_MODEL || 'claude-haiku-4-5-20251001';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: transcript }],
    }),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[voice] anthropic intent failed', res.status, detail.slice(0, 400));
    throw new IntentError('Could not understand that just now. Please try again.');
  }

  const data = await res.json();
  const text = (data?.content || []).map((p) => p?.text || '').join('');
  return { json: parseJsonObject(text), provider: `anthropic:${model}` };
}

async function askOpenAI(transcript, { signal } = {}) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_INTENT_MODEL || 'gpt-4o-mini';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
    }),
    signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[voice] openai intent failed', res.status, detail.slice(0, 400));
    throw new IntentError('Could not understand that just now. Please try again.');
  }

  const data = await res.json();
  return {
    json: parseJsonObject(data?.choices?.[0]?.message?.content),
    provider: `openai:${model}`,
  };
}

/** Which model answers, and whether one can. */
export function intentProvider() {
  const asked = String(process.env.VOICE_INTENT_PROVIDER || '').toLowerCase();
  if (asked === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (asked === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return '';
}

/* ── Validation ──────────────────────────────────────────────────────────── */

const clean = (v, max = 120) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** A model's practice area, mapped onto one the directory actually stores. */
export function resolveCategory(raw) {
  const value = clean(raw, 60).toLowerCase();
  if (!value) return '';

  const exact = CATEGORY_NAMES.find((n) => n.toLowerCase() === value);
  if (exact) return exact;

  if (CATEGORY_ALIASES[value]) return CATEGORY_ALIASES[value];

  // "employment law issues" → the alias whose words it contains. Longest alias
  // first, so "cyber crime" is not beaten by "crime".
  const alias = Object.keys(CATEGORY_ALIASES)
    .sort((a, b) => b.length - a.length)
    .find((k) => value.includes(k));
  if (alias) return CATEGORY_ALIASES[alias];

  // Last resort: a category whose own name shares a distinctive word.
  const loose = CATEGORY_NAMES.find((n) => {
    const head = n.toLowerCase().replace(/ law$/, '').split(/[/&]/)[0].trim();
    return head.length > 3 && value.includes(head);
  });
  return loose || '';
}

/**
 * The model's "sub_issue" matched to a matter the directory lists, so it can
 * be used as a filter. An unrecognised one is kept as a label but never
 * filtered on — showing nothing because a model phrased a matter its own way
 * would be the worst possible answer here.
 */
export function resolveMatter(rawSubIssue, category, transcript = '') {
  const value = clean(rawSubIssue, 80).toLowerCase();
  const pool = category
    ? getSubServices(category).map((m) => ({ matter: m, category }))
    : ALL_MATTERS;

  const score = (matter) => {
    const m = matter.toLowerCase();
    if (!value) return 0;
    if (m === value) return 100;
    if (value.includes(m) || m.includes(value)) return 60;
    // Word overlap, for "salary / wage dispute" against "Wage Disputes".
    const words = new Set(value.split(/[^a-z]+/).filter((w) => w.length > 3));
    const hits = m.split(/[^a-z]+/).filter((w) => w.length > 3 && words.has(w)).length;
    return hits * 25;
  };

  let best = { matter: '', category: '', points: 0 };
  for (const entry of pool) {
    const points = score(entry.matter);
    if (points > best.points) best = { ...entry, points };
  }
  if (best.points >= 50) return best;

  // Nothing from the label — try the transcript itself, which often names the
  // matter outright ("cheque bounce", "anticipatory bail").
  const said = clean(transcript, 400).toLowerCase();
  for (const entry of pool) {
    const m = entry.matter.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
    if (m.length > 5 && said.includes(m)) return { ...entry, points: 55 };
  }
  return { matter: '', category: '', points: 0 };
}

/**
 * The validated intent. Everything is either drawn from the directory's own
 * vocabulary or is plain text that is only ever displayed — nothing a model
 * invented is ever used as a filter.
 *
 * @param {object} raw     whatever the model returned
 * @param {string} transcript
 */
export function validateIntent(raw, transcript) {
  const data = raw && typeof raw === 'object' ? raw : {};

  const category = resolveCategory(data.legal_category)
    || resolveCategory((data.lawyer_specialization || [])[0])
    || resolveCategory(data.issue);

  // The model's own label first, then the issue it wrote, then the words the
  // person actually said — the first of those that lands on a real matter wins.
  const matter = (() => {
    for (const candidate of [data.sub_issue, data.issue, ...(Array.isArray(data.keywords) ? data.keywords : [])]) {
      const hit = resolveMatter(candidate, category, transcript);
      if (hit.matter) return hit;
    }
    return { matter: '', category: '', points: 0 };
  })();

  const specialization = [
    ...new Set(
      [category, ...(Array.isArray(data.lawyer_specialization) ? data.lawyer_specialization : [])]
        .map(resolveCategory)
        .filter(Boolean)
    ),
  ].slice(0, 3);

  const keywords = [
    ...new Set(
      (Array.isArray(data.keywords) ? data.keywords : [])
        .map((k) => clean(k, 40).toLowerCase())
        .filter((k) => k.length > 2)
    ),
  ].slice(0, 8);

  const missing = Array.isArray(data.missing)
    ? data.missing.map((m) => clean(m, 20).toLowerCase()).filter((m) => m === 'location')
    : [];

  return {
    category,
    // Kept even when the category did not resolve: it is what the visitor is
    // shown back ("Unpaid salary"), and being honest about a problem we could
    // not classify is better than a blank.
    issue: clean(data.issue, 60) || 'Legal help',
    sub_issue: matter.matter || clean(data.sub_issue, 60),
    // Only a matter the directory actually lists can be filtered on.
    matter: matter.matter,
    matterCategory: matter.category,
    specialization,
    keywords,
    location: clean(data.location, 60),
    urgency: URGENCY_LEVELS.includes(data.urgency) ? data.urgency : 'medium',
    language: ['hi', 'en', 'hinglish'].includes(data.language) ? data.language : 'en',
    summary: clean(data.summary, 240),
    followUpQuestion: clean(data.follow_up_question, 120),
    missing,
  };
}

/**
 * Read one transcript and return a validated legal intent.
 *
 * @param {string} transcript
 * @returns {Promise<{ intent: object, provider: string }>}
 */
export async function extractLegalIntent(transcript, options = {}) {
  const said = clean(transcript, 2000);
  if (said.length < 8) {
    throw new IntentError('Please say a little more about your problem.', {
      status: 422,
      code: 'too_vague',
    });
  }

  const provider = intentProvider();
  if (!provider) {
    throw new IntentError('Voice search is not switched on for this site yet.', {
      status: 503,
      code: 'not_configured',
    });
  }

  const { json, provider: used } = provider === 'anthropic'
    ? await askAnthropic(said, options)
    : await askOpenAI(said, options);

  if (!json) {
    console.error('[voice] intent was not JSON');
    throw new IntentError('Could not understand that just now. Please try again.');
  }

  return { intent: validateIntent(json, said), provider: used };
}
