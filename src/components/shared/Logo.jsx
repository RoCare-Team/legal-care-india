import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/utils/cn';
import { SITE } from '@/constants/site';

/**
 * Logo — the brand lockup, links home.
 *
 * `public/logo1.png` is the finished artwork: the book-and-scales emblem, a
 * thin rule, then the JUSTICELAND wordmark, drawn to sit level with it.
 *
 * It is shown here as one picture at its own proportions. The two parts used to
 * be cropped out and sized separately, which let the emblem be set larger — but
 * that also meant the wordmark rendered at 24px against a 56px emblem, less
 * than half the size the artwork gives it. What reached the page was not the
 * logo, it was a rearrangement of it.
 *
 * The only thing cropped away is the file's empty margin, so the artwork fills
 * its box instead of floating in the middle of one. In the 2061×512 image the
 * artwork occupies x 82–1968, y 105–432 — 1886 × 327, or 5.7676 : 1.
 *
 * Sizing is by height, because height is what the bar has to hold: at h-10 the
 * whole lockup is 40px tall and 231px wide, and the emblem inside it is the
 * full 40px rather than a separately enlarged crop.
 *
 * The PNG has an alpha channel but does not use it — its ground is opaque
 * white — so on a dark surface the plate below is what stops it reading as a
 * bare white rectangle.
 *
 * @param {object} props
 * @param {boolean} [props.onDark=false]  for placement on a dark background
 * @param {string} [props.className]      overrides the responsive height
 */

/** The image's own pixel dimensions — the basis for every percentage below. */
const FILE = { width: 2061, height: 512 };

/** public/logo-header.webp: logo1.png resized to 1080px wide, same proportions. */
const HEADER_FILE = { width: 1080, height: 268 };

/**
 * The artwork's box within the file, as percentages of its own container.
 *
 * For a bounding box at (x, y) of size (w, h) in an image of width W:
 * container aspect = w/h, image width = W/w, left = −x/w, top = −y/h. Height is
 * left to the image so its aspect is never distorted.
 */
const ART = {
  ratio: '5.7676 / 1',
  width: '109.279%',
  left: '-4.348%',
  top: '-32.110%',
};

export default function Logo({ onDark = false, className }) {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} — home`}
      className={cn(
        'inline-flex shrink-0 items-center',
        // The file's white ground is part of the picture. On the dark footer
        // that would read as a bare white block, so the plate rounds its
        // corners and gives the artwork a margin to sit in. On a white page it
        // is invisible and unnecessary.
        onDark && 'rounded-xl bg-white px-3 py-2 shadow-sm',
        className
      )}
    >
      {/* 32 → 40px tall, i.e. 185 → 231px wide. Sized against the 64px header
          capsule, which the tallest step still leaves 12px of air inside. */}
      <span
        className="relative block h-8 overflow-hidden sm:h-9 xl:h-10"
        style={{ aspectRatio: ART.ratio }}
      >
        {/* A prepared 1080px WebP (23KB), served as it is rather than through
            the image optimizer: the logo is on every page, and a slow or failed
            optimizer request — a dev server restarting, a cold first hit —
            left a broken-image icon where the brand should be. 1080px is about
            4x its drawn width, so it stays crisp at any zoom. */}
        <Image
          src="/logo-header.webp"
          alt=""
          width={HEADER_FILE.width}
          height={HEADER_FILE.height}
          unoptimized
          className="absolute max-w-none"
          style={{ width: ART.width, height: 'auto', left: ART.left, top: ART.top }}
          priority
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
