'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Send, PenLine, X, CheckCircle2 } from 'lucide-react';
import { Button, FormField, Input, Textarea } from '@/components/ui';

/**
 * TestimonialForm — a "Share your experience" button that opens a modal where
 * any visitor can review the platform. On success it refreshes the page so the
 * new review shows in the slider.
 */
export default function TestimonialForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const close = () => {
    if (loading) return;
    setOpen(false);
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Please enter your name.');
    if (rating < 1) return setError('Please select a star rating.');
    if (text.trim().length < 10) return setError('Please write a bit about your experience.');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, city, rating, text }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not post your review. Please try again.');
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-6 py-3 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent hover:bg-accent/15 hover:shadow-card"
      >
        <PenLine className="h-4 w-4 transition-transform group-hover:-rotate-12" />
        Share your experience
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="testimonial-title"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 id="testimonial-title" className="font-display text-xl font-semibold text-ink">
                Share your experience
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {done ? (
              <div className="mt-6 flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" aria-hidden="true" />
                <p className="font-semibold text-ink">Thanks for your review!</p>
                <p className="text-sm text-ink/55">It now appears in Client Stories.</p>
                <Button type="button" className="mt-3" onClick={() => { setOpen(false); setDone(false); }}>
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-4">
                {/* Star picker */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          n <= (hover || rating) ? 'fill-accent text-accent' : 'text-ink/25'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-4">
                  <FormField label="Your name" htmlFor="t-name">
                    <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya S." maxLength={60} />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Role (optional)" htmlFor="t-role">
                      <Input id="t-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Homebuyer" maxLength={60} />
                    </FormField>
                    <FormField label="City (optional)" htmlFor="t-city">
                      <Input id="t-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Delhi" maxLength={60} />
                    </FormField>
                  </div>
                  <FormField label="Your review" htmlFor="t-text">
                    <Textarea id="t-text" value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={600} placeholder="How was your experience using Legal Care India?" />
                  </FormField>

                  {error && <p className="text-xs text-red-600">{error}</p>}

                  <Button type="submit" fullWidth disabled={loading} leftIcon={<Send className="h-4 w-4" />}>
                    {loading ? 'Posting…' : 'Post review'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
