import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/utils/cn';
import { SITE } from '@/constants/site';

/**
 * Logo — the brand lockup, links home.
 *
 * `public/logo5.jpeg` is the finished artwork: the book-and-scales emblem, a
 * thin rule, and the JUSTICELAND wordmark, all in one 872×252 file. It is drawn
 * here exactly as it was supplied — one picture, whole, at its own aspect ratio.
 *
 * It used to be shown as two separate crops so the emblem could be enlarged
 * against the wordmark. That let the emblem lead, but it also fixed the
 * wordmark's height at 20–24px, which is where the letterforms stopped being
 * readable — the whole point of a wordmark. So the lockup is one image again and
 * the size is set on the *width*: the wordmark is over half the file, so width
 * is what actually governs how large the type renders.
 *
 * Sizing is width-first, and the header bar is sized to fit it rather than the
 * other way round — see Header.jsx, whose bar heights are derived from these
 * numbers. At the 3.4603:1 file ratio:
 *
 *   232px wide → 67px tall   (xl and up — the desktop target)
 *   196px wide → 57px tall   (lg)
 *   176px wide → 51px tall   (sm/tablet)
 *   156px wide → 45px tall   (phone: shares the bar only with the menu button)
 *
 * These are one step down from where they first landed. 264px made the wordmark
 * unambiguously large, but the bar it needed was 96px deep — taller than the
 * header of any firm this site is meant to sit beside, and enough to eat a
 * visible slice of every page below it. 232px still renders JUSTICELAND about
 * 40% wider than the old two-crop lockup managed, in a bar of ordinary height.
 *
 * `shrink-0` matters: the logo sits in a flex row next to a `flex-1` nav, and
 * without it a crowded bar squeezes the logo first — which is exactly how the
 * wordmark ended up unreadable.
 *
 * Being a JPEG it has no transparency, so on a dark surface the plate below is
 * what stops it reading as a bare white rectangle.
 *
 * @param {object} props
 * @param {boolean} [props.onDark=false]  for placement on a dark background
 * @param {string} [props.className]      overrides the responsive width
 */

/** The file's own pixel dimensions — 872 × 252, i.e. 3.4603 : 1. */
const FILE = { width: 872, height: 252 };

export default function Logo({ onDark = false, className }) {
  return (
    <Link
      href="/"
      aria-label={`${SITE.name} — home`}
      className={cn(
        'block shrink-0',
        // This file is a JPEG, so it has no transparency — its white ground is
        // part of the picture. On the dark footer that would read as a bare
        // white block, so the plate rounds its corners and gives the artwork a
        // margin to sit in. `w-fit` keeps the plate the width of the logo
        // instead of stretching across the footer column.
        onDark && 'w-fit rounded-xl bg-white px-2.5 py-2 shadow-sm',
        className
      )}
    >
      <Image
        src="/logo5.jpeg"
        alt=""
        width={FILE.width}
        height={FILE.height}
        // Only the widths this actually renders at, so the browser downloads a
        // 264px-wide file on desktop rather than the full 872px original.
        sizes="(max-width: 639px) 156px, (max-width: 1023px) 176px, (max-width: 1279px) 196px, 232px"
        // Above the default 75. The serifs on JUSTICELAND are thin, and at this
        // size a re-encode at 75 puts visible mush on their edges; the file is
        // 36KB to begin with, so the extra bytes are not worth arguing about.
        quality={95}
        priority
        // `h-auto` with a set width is what preserves the aspect ratio — the
        // intrinsic width/height above give Next the ratio, and nothing here
        // constrains the height, so the picture can never be squashed.
        className="h-auto w-[156px] object-contain sm:w-[176px] lg:w-[196px] xl:w-[232px]"
      />
    </Link>
  );
}
