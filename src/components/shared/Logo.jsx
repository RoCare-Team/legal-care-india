import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/utils/cn';
import { SITE } from '@/constants/site';

/**
 * Logo — the brand lockup, links home.
 *
 * `public/logo2.png` is a horizontal lockup — book-and-scales mark, a rule,
 * then the wordmark — sitting inside a good deal of empty margin. Rendered
 * whole it would be well under half the height it should be at any given box
 * size, so the margin is cropped away here rather than in a second file: one
 * asset to replace when the brand changes.
 *
 * The crop is exact, measured off the file itself. The artwork occupies
 * x 5.52%–94.20% and y 26.63%–68.56% of the image; the two CROP entries below
 * turn that into the width and offsets an absolutely-positioned image needs to
 * make the artwork exactly fill its container.
 *
 * The background is transparent, but the artwork is navy and gold — navy on a
 * navy footer is nothing at all — so on a dark surface it is given a white
 * plate to sit on.
 *
 * @param {object} props
 * @param {boolean} [props.compact=false]  the mark alone, without the wordmark
 * @param {boolean} [props.onDark=false]   for placement on a dark background
 * @param {string} [props.className]
 */

/**
 * Crop geometry per variant, as percentages of the *container*.
 *
 * Derived from the artwork's bounding box (Lx, Ty, Wx, Hy as percentages of
 * the image): width = 100/Wx, left = −Lx/Wx, top = −Ty/Hy, and the container's
 * own aspect ratio is the artwork's. Height is left to the image so its aspect
 * is never distorted.
 */
const CROP = {
  // Mark + wordmark: x 5.516%, y 26.629%, w 88.685%, h 41.926% → 4.2365 : 1
  full: { ratio: '4.2365 / 1', width: '112.759%', left: '-6.220%', top: '-63.516%' },
  // Mark alone: x 5.516%, y 26.629%, w 27.016%, h 41.926% → 1.2905 : 1
  mark: { ratio: '1.2905 / 1', width: '370.152%', left: '-20.417%', top: '-63.516%' },
};

export default function Logo({ compact = false, onDark = false, className }) {
  const crop = compact ? CROP.mark : CROP.full;

  return (
    <Link
      href="/"
      aria-label={`${SITE.name} — home`}
      className={cn(
        'inline-flex items-center',
        // The plate is only for dark surfaces; on a white page the file's own
        // white background already blends and a plate would be invisible.
        onDark && 'rounded-xl bg-white px-2 py-1.5 shadow-sm',
        className
      )}
    >
      <span
        className="relative block h-8 overflow-hidden sm:h-9"
        style={{ aspectRatio: crop.ratio }}
      >
        <Image
          src="/logo2.png"
          alt={SITE.name}
          width={707}
          height={353}
          className="absolute max-w-none"
          style={{ width: crop.width, height: 'auto', left: crop.left, top: crop.top }}
          priority
        />
      </span>
    </Link>
  );
}
