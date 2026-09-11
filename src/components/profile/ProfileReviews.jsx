import { Star, MessageSquareQuote } from 'lucide-react';
import { Avatar } from '@/components/ui';
import Rating from '@/components/shared/Rating';
import ProfileSection from './ProfileSection';
import ReviewForm from './ReviewForm';
import { formatRating, pluralize } from '@/utils/formatters';

/**
 * ProfileReviews — rating summary, individual client reviews and a form to
 * submit a new review.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function ProfileReviews({ advocate }) {
  const { rating, reviews, reviewsList = [], legalCareId } = advocate;
  const hasReviews = reviewsList.length > 0;

  return (
    <ProfileSection id="reviews" title="Client Reviews" icon={MessageSquareQuote}>
      {/* The score block only once there is a score. A large "0.0" over five
          grey stars reads as a lawyer clients rated badly, not one nobody has
          rated yet. */}
      {hasReviews && (
        <div className="mb-5 flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-amber-50 to-[#F8FAFC] p-5 ring-1 ring-amber-100 sm:flex-row sm:gap-6">
          <div className="text-center">
            <p className="font-display text-4xl font-semibold text-ink">{formatRating(rating)}</p>
            <div className="mt-1 flex justify-center">
              <Rating value={rating} showValue={false} />
            </div>
            <p className="mt-1 text-xs text-ink/55">{pluralize(reviews, 'review')}</p>
          </div>
          <p className="text-sm text-ink/60 sm:border-l sm:border-ink/10 sm:pl-6">
            Reviews are shared by clients who worked with this lawyer. Have you consulted them?
            Share your experience below.
          </p>
        </div>
      )}

      {hasReviews ? (
        <ul className="space-y-3">
          {reviewsList.map((r) => (
            <li key={r.id} className="rounded-xl border border-ink/8 bg-[#FBFCFE] p-4">
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
      ) : (
        <div className="rounded-xl border border-dashed border-ink/15 bg-[#FBFCFE] px-6 py-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-accent/10 text-accent">
            <Star className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-[14.5px] font-semibold text-ink">No reviews yet</p>
          <p className="mt-1 text-sm text-ink/55">
            Consulted {advocate.name}? Be the first to share your experience.
          </p>
        </div>
      )}

      <ReviewForm legalCareId={legalCareId} />
    </ProfileSection>
  );
}
