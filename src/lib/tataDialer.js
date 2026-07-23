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

    console.log('[dialer] Smartflo accepted the call', data);
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
