/**
 * Click-to-call via Tata Tele "Smartflo".
 *
 * Smartflo dials the *agent* first and, once they pick up, bridges them to the
 * *destination*. Both legs are placed by Smartflo, so the number each party
 * sees is the `caller_id` on the request — not the other party's number.
 *
 * Server-only: the API token grants the ability to spend money on calls, so it
 * must never reach the browser. Nothing here may be imported from a client
 * component.
 *
 * Configure in .env.local:
 *   TATA_SMARTFLO_TOKEN      — the JWT from Smartflo → API → token generate
 *   TATA_SMARTFLO_CALLER_ID  — the account DID (e.g. 08069714930)
 *
 * With the token unset, calls are not placed and the attempt is logged instead,
 * mirroring how `sms.js` degrades in development.
 */
import { normalizeIndianMobile } from './sms';

const ENDPOINT = 'https://api-smartflo.tatateleservices.com/v1/click_to_call';

/**
 * Smartflo does not answer until it has finished setting the call up, which
 * includes ringing the agent. 20s was short enough to abort calls that were
 * still being placed, so the client saw a timeout for a call that went through.
 */
const TIMEOUT_MS = 45000;

/** True when a token is configured — used to hide the feature in the UI. */
export function isDialerConfigured() {
  return Boolean(process.env.TATA_SMARTFLO_TOKEN);
}

/** One POST to Smartflo. Resolves to a result object; never throws. */
async function send({ token, agent, destination, callerId }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      // Smartflo takes the bare JWT, not a `Bearer`-prefixed one. Whatever is
      // in the env var is sent verbatim, so a token pasted with or without the
      // prefix behaves the way the dashboard showed it.
      headers: {
        Accept: 'application/json',
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_number: agent,
        destination_number: destination,
        ...(callerId ? { caller_id: callerId } : {}),
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Log the provider's own wording server-side; the client gets a code.
      console.error('[dialer] Smartflo rejected the call', res.status, data);
      return {
        ok: false,
        error: res.status === 401 || res.status === 403 ? 'auth-failed' : 'provider-error',
        detail: data?.message || `HTTP ${res.status}`,
      };
    }

    if (process.env.NODE_ENV !== 'production') console.log('[dialer] Smartflo accepted the call', data);
    return { ok: true, data };
  } catch (err) {
    if (err?.name === 'AbortError') {
      console.error('[dialer] Smartflo timed out');
      return { ok: false, error: 'timeout' };
    }
    console.error('[dialer] Smartflo request failed', err);
    return { ok: false, error: 'request-failed' };
  } finally {
    clearTimeout(timer);
  }
}

/** Last 10 digits of a number, for comparing formats that differ (+91, 0, …). */
function last10(value) {
  return normalizeIndianMobile(value || '').slice(-10);
}

/** "YYYY-MM-DD HH:MM:SS" in IST — the format and timezone Smartflo reports in. */
function istStamp(date) {
  // 'sv-SE' formats as YYYY-MM-DD HH:MM:SS, which is exactly Smartflo's Y-m-d H:i:s.
  return new Date(date).toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
}

/** The reverse: a Smartflo IST stamp back into a Date, or null if unparseable. */
function istToDate(stamp) {
  const s = String(stamp || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(s)) return null;
  const date = new Date(`${s.replace(' ', 'T')}+05:30`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** One authenticated GET to Smartflo. Resolves to parsed JSON, or null. */
async function get(path, params = {}) {
  const token = process.env.TATA_SMARTFLO_TOKEN;
  if (!token) return null;

  const url = new URL(`https://api-smartflo.tatateleservices.com${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: token },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[dialer] GET', path, 'failed', res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('[dialer] GET', path, 'failed', err?.name || err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Has this call actually been answered, or was it declined / left to ring?
 *
 * Smartflo's click-to-call only reports that a call was *placed* — the number
 * being rung says nothing back through that API. So the only honest way to know
 * whether the lawyer picked up is to ask afterwards, which takes two sources:
 *
 *   live_calls    — a call in progress right now. This is what "answered" looks
 *                   like while it is still happening.
 *   call/records  — the CDR, written once a call is over. `answered_seconds` of
 *                   0 is a call that rang and was never picked up (declined,
 *                   busy, or ignored).
 *
 * Neither knowing yet is the normal state while the phone is still ringing, so
 * an unknown answer is 'ringing', never 'declined' — a caller must not be
 * charged, and must not be told "declined", on a call that may still connect.
 *
 * The same two sources tell us when the call is over: it drops out of
 * live_calls and a CDR appears with time on the clock. That is 'ended', and it
 * is what stops the consultation the moment either side hangs up their phone.
 *
 * @returns {Promise<{state: 'answered'|'ended'|'declined'|'ringing', seconds: number}>}
 *   answered — connected right now
 *   ended    — was answered, and the handsets have since hung up
 *   declined — rang out or was rejected; never connected
 *   ringing  — nothing known yet; it may still connect
 *   seconds  — answered seconds, known only once the call is over
 */
export async function checkCallOutcome({ agentNumber, clientNumber, since }) {
  const agent = last10(agentNumber);
  const client = last10(clientNumber);

  // 1. Connected right now?
  const live = await get('/v1/live_calls', { agent_number: agent });
  const liveRows = Array.isArray(live) ? live : (live?.results ?? live?.data ?? []);
  if (Array.isArray(liveRows)) {
    const match = liveRows.find((r) => last10(r?.customer_number) === client);
    if (match) return { state: 'answered', seconds: 0 };
  }

  // 2. Over already — did it ever get answered?
  const from = new Date(new Date(since).getTime() - 5 * 60 * 1000);
  const to = new Date(Date.now() + 5 * 60 * 1000);
  const cdr = await get('/v1/call/records', {
    from_date: istStamp(from),
    to_date: istStamp(to),
    limit: 50,
    page: 1,
  });
  const rows = cdr?.results ?? cdr?.data ?? (Array.isArray(cdr) ? cdr : []);
  if (Array.isArray(rows) && rows.length) {
    // Only records from THIS call. The same two people may well have spoken a
    // few minutes ago, and an older record would otherwise end the new call the
    // instant it started.
    const floor = new Date(since).getTime() - 10 * 1000;
    const match = rows.find((r) => {
      const isPair = last10(r?.client_number) === client || last10(r?.destination) === client;
      if (!isPair) return false;
      const stamp = istToDate(r?.end_stamp || `${r?.date} ${r?.time}`);
      return !stamp || stamp.getTime() >= floor;
    });
    if (match) {
      const seconds = Math.max(0, Number(match.answered_seconds) || 0);
      if (process.env.NODE_ENV !== 'production') console.log(`[dialer] call ${seconds > 0 ? 'ended' : 'not answered'}`, {
        client_number: match.client_number,
        answered_seconds: match.answered_seconds,
        status: match.status,
        description: match.description,
      });
      // A record only exists once the call is over, so an answered one means
      // they talked and have since hung up.
      return { state: seconds > 0 ? 'ended' : 'declined', seconds };
    }
  }

  // Still ringing (or Smartflo hasn't written the record yet).
  return { state: 'ringing', seconds: 0 };
}

/**
 * Place a bridged call between two Indian mobile numbers.
 *
 * Never throws: every failure comes back as `{ ok: false, error }` with a
 * machine-readable code, so the caller decides what the user sees. A dialler
 * outage must not take a page down with it.
 *
 * @param {object} params
 * @param {string} params.agentNumber        rings first — the person initiating
 * @param {string} params.destinationNumber  bridged in once the agent answers
 * @param {string} [params.callerId]  number to display to both parties. Tata
 *   only permits a DID registered on the account; anything else is treated as
 *   CLI spoofing and refused, so a rejected request is retried once with the
 *   configured DID rather than losing the call.
 * @returns {Promise<{ ok: boolean, error?: string, detail?: string, data?: object }>}
 */
export async function placeClickToCall({ agentNumber, destinationNumber, callerId }) {
  const agent = normalizeIndianMobile(agentNumber);
  const destination = normalizeIndianMobile(destinationNumber);

  if (agent.length !== 10 || destination.length !== 10) {
    return { ok: false, error: 'invalid-number' };
  }

  // Bridging a number to itself makes Smartflo dial out and immediately find
  // the line busy — it burns a call leg and reports a confusing failure.
  if (agent === destination) {
    return { ok: false, error: 'same-number' };
  }

  const token = process.env.TATA_SMARTFLO_TOKEN;
  const accountDid = process.env.TATA_SMARTFLO_CALLER_ID;

  if (!token) {
    console.warn(
      `\n[dialer] TATA_SMARTFLO_TOKEN not set — call NOT placed.\n  Agent: ${agent}\n  Destination: ${destination}\n`
    );
    return { ok: false, error: 'not-configured' };
  }

  const requested = normalizeIndianMobile(callerId || '') || accountDid;
  const result = await send({ token, agent, destination, callerId: requested });

  // A caller ID Tata does not recognise comes back as a plain rejection, which
  // would otherwise mean no call at all. Falling back to the account's own DID
  // costs one extra request and keeps the call happening.
  if (!result.ok && result.error === 'provider-error' && accountDid && requested !== accountDid) {
    console.warn(
      `[dialer] caller_id ${requested} refused by Smartflo — retrying with the account DID ${accountDid}`
    );
    return send({ token, agent, destination, callerId: accountDid });
  }

  return result;
}
