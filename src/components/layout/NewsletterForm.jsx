'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * NewsletterForm — the footer's "subscribe" field.
 *
 * There is no mailing-list service wired to this site, and a field that
 * swallows an address and shows a tick would be a lie told to everyone who
 * types into it. So a subscription is filed as a contact message instead: it
 * lands in the same admin inbox the contact form fills, under a subject that
 * says what it is. Somebody has to act on it by hand, which is honest for a
 * list this size and costs no new backend.
 *
 * The email doubles as the name because the API asks for one and an address is
 * the only thing this form collects — there is nothing else to send.
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError('Enter a valid email address.');
      return;
    }

    setState('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: value,
          email: value,
          subject: 'Newsletter subscription',
          message: `Please add ${value} to the Justiceland newsletter.`,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error || 'Could not subscribe. Please try again.');
        setState('idle');
        return;
      }
      setState('done');
      setEmail('');
    } catch {
      setError('Network error. Please try again.');
      setState('idle');
    }
  };

  if (state === 'done') {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm text-accent">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        You are on the list. Thank you.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3">
      <div className="flex items-center gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-sm text-white placeholder:text-white/40 transition-colors focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          aria-label="Subscribe"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-[#E7C766] via-accent to-[#BC9A2E] text-[#241B02] shadow-gold transition-all hover:brightness-[1.03] disabled:opacity-60"
        >
          {state === 'sending' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </form>
  );
}
