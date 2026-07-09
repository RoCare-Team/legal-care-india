'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import { Button, FormField, Input, Textarea } from '@/components/ui';

/**
 * ReviewForm — lets any visitor post a client review for an advocate.
 * On success it refreshes the server data so the new review appears.
 *
 * @param {object} props
 * @param {string} props.slug  advocate slug (API target)
 */
export default function ReviewForm({ slug }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (author.trim().length < 2) return setError('Please enter your name.');
    if (rating < 1) return setError('Please select a star rating.');
    if (text.trim().length < 5) return setError('Please write a short review.');
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/advocates/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, rating, text }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not post your review. Please try again.');
        return;
      }
      setDone(true);
      setAuthor('');
      setRating(0);
      setText('');
      router.refresh(); // reload the profile so the new review shows
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
        Thanks! Your review has been posted.
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mt-6">
        <Button type="button" variant="outline" onClick={() => setOpen(true)} leftIcon={<Star className="h-4 w-4" />}>
          Write a review
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-ink/8 bg-muted/30 p-5">
      <h3 className="font-display text-base font-semibold text-ink">Write a review</h3>

      {/* Star picker */}
      <div className="mt-3 flex items-center gap-1">
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
        {rating > 0 && <span className="ml-2 text-sm font-medium text-ink/60">{rating}.0</span>}
      </div>

      <div className="mt-4 space-y-4">
        <FormField label="Your name" htmlFor="review-author">
          <Input
            id="review-author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. Rahul S."
            maxLength={60}
          />
        </FormField>
        <FormField label="Your review" htmlFor="review-text">
          <Textarea
            id="review-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your experience working with this advocate…"
            rows={4}
            maxLength={1000}
          />
        </FormField>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading} leftIcon={<Send className="h-4 w-4" />}>
            {loading ? 'Posting…' : 'Post review'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
