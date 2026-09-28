/**
 * Instant document review — an AI reads one legal document (PDF or photo) and
 * returns what a careful reader would flag: what it is, how risky it is to
 * sign, the red flags, the clauses that are missing, the key terms, and what
 * to ask for. It is framed as a first read, never as legal advice, and the
 * result always points to a lawyer for anything that matters.
 *
 * Runs on OpenAI (OPENAI_API_KEY), which reads PDFs and photos natively.
 * The model is OPENAI_REVIEW_MODEL (default gpt-4o — a legal read needs more
 * than the mini model voice search uses). Anthropic is only a fallback for a
 * deployment with no OpenAI key.
 */

export class ReviewError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

const SYSTEM_PROMPT = `You review legal documents for people in India who are about to sign, or have received, a document and want a first read before speaking to a lawyer.

Read the whole document and return ONLY a JSON object of this exact shape:
{
  "is_legal_document": true,
  "document_type": "what the document is, e.g. 'Residential rent agreement'",
  "summary": "2-3 plain-English sentences: who the parties are, what it does, the key money and dates",
  "risk_level": "low | medium | high — how risky it is for the person reviewing it to sign or accept it as written",
  "red_flags": [{ "title": "short label", "detail": "one or two sentences: what the clause says and why it is a problem for the reader", "severity": "low | medium | high" }],
  "missing_clauses": [{ "title": "the clause that should be there", "detail": "why it matters for this kind of document" }],
  "key_terms": [{ "label": "e.g. Rent, Deposit, Term, Notice period, Governing law", "value": "as written in the document" }],
  "suggestions": ["concrete things to ask to change or add before signing, one sentence each"]
}

Rules:
- Judge it under Indian law and Indian practice (stamp duty, registration, notice periods, jurisdiction).
- Be specific to THIS document — quote amounts, days and clause numbers where they exist. Never pad with generic advice.
- 0-6 red flags, 0-6 missing clauses, 3-8 key terms, 2-5 suggestions. Fewer is fine when the document is sound.
- If the file is not a legal document or is unreadable, set "is_legal_document" to false and leave the lists empty.
- Do not predict the outcome of any case. Output the JSON object and nothing else.`;

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

function userText(question) {
  const q = String(question || '').trim();
  return q
    ? `Review this document. The person also asks: "${q.slice(0, 500)}" — answer it within the findings where relevant.`
    : 'Review this document.';
}

async function askAnthropic({ base64, mimeType, question, signal }) {
  const model = process.env.ANTHROPIC_REVIEW_MODEL || 'claude-haiku-4-5-20251001';
  const source = { type: 'base64', media_type: mimeType, data: base64 };
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          mimeType === 'application/pdf' ? { type: 'document', source } : { type: 'image', source },
          { type: 'text', text: userText(question) },
        ],
      }],
    }),
  });
  if (!res.ok) throw new ReviewError(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = (data.content || []).map((c) => c.text || '').join('');
  return { json: parseJsonObject(text), provider: `anthropic:${model}` };
}

async function askOpenAI({ base64, mimeType, fileName, question, signal }) {
  const model = process.env.OPENAI_REVIEW_MODEL || 'gpt-4o';
  const dataUrl = `data:${mimeType};base64,${base64}`;
  const part = mimeType === 'application/pdf'
    ? { type: 'file', file: { filename: fileName || 'document.pdf', file_data: dataUrl } }
    : { type: 'image_url', image_url: { url: dataUrl } };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: [part, { type: 'text', text: userText(question) }] },
      ],
    }),
  });
  if (!res.ok) throw new ReviewError(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return { json: parseJsonObject(data.choices?.[0]?.message?.content), provider: `openai:${model}` };
}

export function isReviewAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

const str = (v, max = 600) => String(v ?? '').trim().slice(0, max);
const level = (v) => (['low', 'medium', 'high'].includes(String(v).toLowerCase()) ? String(v).toLowerCase() : '');
const list = (v, n) => (Array.isArray(v) ? v.slice(0, n) : []);

/** The model's answer, cut down to the stored shape — nothing else survives. */
function clean(raw) {
  return {
    isLegal: raw?.is_legal_document !== false,
    documentType: str(raw?.document_type, 120),
    summary: str(raw?.summary, 900),
    riskLevel: level(raw?.risk_level) || 'medium',
    redFlags: list(raw?.red_flags, 8).map((f) => ({
      title: str(f?.title, 120), detail: str(f?.detail), severity: level(f?.severity) || 'medium',
    })).filter((f) => f.title),
    missingClauses: list(raw?.missing_clauses, 8).map((f) => ({
      title: str(f?.title, 120), detail: str(f?.detail), severity: '',
    })).filter((f) => f.title),
    keyTerms: list(raw?.key_terms, 10).map((t) => ({ label: str(t?.label, 60), value: str(t?.value, 200) }))
      .filter((t) => t.label && t.value),
    suggestions: list(raw?.suggestions, 6).map((s) => str(s, 300)).filter(Boolean),
  };
}

/**
 * @param {{ buffer: Buffer, mimeType: string, fileName?: string, question?: string }} input
 * @returns {Promise<object>} cleaned findings plus `provider`
 */
export async function reviewDocument({ buffer, mimeType, fileName, question }) {
  if (!isReviewAiConfigured()) throw new ReviewError('Instant review is not available right now.', 503);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  const input = { base64: buffer.toString('base64'), mimeType, fileName, question, signal: controller.signal };
  try {
    const out = process.env.OPENAI_API_KEY ? await askOpenAI(input) : await askAnthropic(input);
    if (!out.json) throw new ReviewError('The review came back unreadable.');
    return { ...clean(out.json), provider: out.provider };
  } catch (err) {
    if (err.name === 'AbortError') throw new ReviewError('The review took too long. Please try again.', 504);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
