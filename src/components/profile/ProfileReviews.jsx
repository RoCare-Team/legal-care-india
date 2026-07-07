import { Star, MessageSquareQuote } from 'lucide-react';
import { Avatar } from '@/components/ui';
import Rating from '@/components/shared/Rating';
import ProfileSection from './ProfileSection';
import { formatRating, pluralize } from '@/utils/formatters';

/**
 * ProfileReviews — rating summary plus individual client reviews.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileReviews({ advocate }) {
  const { rating, reviews, reviewsList = [] } = advocate;

  return (
    <ProfileSection id="reviews" title="Client Reviews" icon={MessageSquareQuote}>
      <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl bg-muted/50 p-5 sm:flex-row sm:gap-6">
        <div className="text-center">
          <p className="font-display text-4xl font-semibold text-ink">{formatRating(rating)}</p>
          <div className="mt-1 flex justify-center">
            <Rating value={rating} showValue={false} />
          </div>
          <p className="mt-1 text-xs text-ink/55">{pluralize(reviews, 'review')}</p>
        </div>
        <p className="text-sm text-ink/60 sm:border-l sm:border-ink/10 sm:pl-6">
          Ratings are collected from verified clients who contacted this advocate through
          Legal Care India.
        </p>
      </div>

      <ul className="space-y-4">
        {reviewsList.map((r) => (
          <li key={r.id} className="rounded-xl border border-ink/8 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={r.author} size="sm" />
                <div>
                  <p className="text-sm font-medium text-ink">{r.author}</p>
                  <p className="text-xs text-ink/45">{r.date}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-amber-700">
                <Star className="h-3 w-3 fill-accent text-accent" aria-hidden="true" />
                {formatRating(r.rating)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">{r.text}</p>
          </li>
        ))}
      </ul>
    </ProfileSection>
  );
}
