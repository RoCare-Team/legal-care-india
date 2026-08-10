'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import Container from '@/components/ui/Container';
import Logo from '@/components/shared/Logo';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import HeaderAuth from './HeaderAuth';
import LocationPicker from '@/components/location/LocationPicker';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useDisclosure } from '@/hooks/useDisclosure';

/**
 * Header — top bar with logo, desktop nav, CTAs and a mobile menu trigger.
 *
 * Everything from the logo to the account actions lives on one white surface.
 * On the homepage that surface is a floating rounded bar over the dark hero
 * (fixed, so the image runs up behind it); scrolled, and on every other route,
 * it becomes the full-width bar pinned to the top.
 *
 * One white surface either way, so nothing inside it needs a light-on-dark
 * variant. The bar used to be transparent over the hero, which left the nav,
 * the location and the account buttons as loose pale words competing with a
 * photograph — legible only where the image happened to be dark.
 */
export default function Header() {
  const scrollY = useScrollPosition();
  const menu = useDisclosure(false);
  const scrolled = scrollY > 8;

  // Only the homepage has a dark hero for the bar to float over.
  const overlay = usePathname() === '/';
  // Floating capsule while actually over that hero; a plain bar once scrolled.
  const floating = overlay && !scrolled;

  return (
    <>
    <header
      className={cn(
        'z-40 w-full transition-all duration-200',
        overlay ? 'fixed top-0 left-0' : 'sticky top-0',
        floating
          // The gap above the capsule is tighter on a phone so the bar still
          // ends at the 72px the hero's own top padding is measured against —
          // its first line would otherwise sit a few pixels under the bar.
          ? 'border-b border-transparent bg-transparent py-2 sm:py-3'
          // Note for the heights below: this padding stacks on top of the
          // capsule, and the hero's own top padding (pt-20 / sm:pt-28) is what
          // the whole lot has to stay under. At the tallest step that is
          // 12 + 92 = 104px against 112px, so the hero's first line still
          // clears the bar.
          // Fully opaque, not the frosted `bg-surface/95 backdrop-blur-md` it
          // used to be. The logo is a photograph with a solid white background,
          // so against a bar that was letting 5% of the page through it read as
          // a brighter rectangle sitting on top of the bar rather than part of
          // it. Frosting is worth less than a header that looks like one piece.
          : scrolled
            ? 'border-b border-ink/10 bg-surface shadow-sm'
            : 'border-b border-ink/8 bg-surface'
      )}
    >
      {/* Wider than the page's own `default` gutter. That was tried once before
          and reverted, because the extra 128px became slack the centred nav
          split evenly on either side and the bar looked gappy. It is back
          because the logo is now 264px rather than 186px and the desktop nav
          starts at xl rather than lg: the slack has somewhere to go, and
          without it the centred nav overlaps the logo on the home page's
          inset capsule. */}
      <Container size="wide">
        {/* The bar's height follows the logo, not the other way round. The
            lockup is drawn whole at 156 → 232px wide (Logo.jsx), which at the
            file's 3.4603:1 ratio is 45 → 67px tall; each step below leaves it
            roughly 7px of air top and bottom, so it stays centred with a
            margin instead of filling the bar edge to edge. `items-center` is
            what centres it; nothing here caps the logo's height. */}
        <div
          className={cn(
            'flex items-center gap-2 transition-all duration-200 xl:gap-3',
            floating
              // `rounded-full` curves away half the bar's height at each end,
              // so the padding has to clear that curve — at px-4 the Log out
              // button's corner sat outside the white and hung over the hero.
              // Not `overflow-hidden`: the location and account menus drop out
              // of this box, and clipping would cut them off at the bar.
              ? 'h-[60px] rounded-full bg-white px-4 shadow-[0_8px_28px_-10px_rgba(15,23,42,0.45)] ring-1 ring-ink/5 sm:h-[66px] sm:px-6 lg:h-[70px] xl:h-[80px] xl:px-5'
              : 'h-[62px] sm:h-[68px] lg:h-[72px] xl:h-[82px]'
          )}
        >
          <Logo />

          {/* Desktop nav starts at xl, not lg. Between 1024 and 1280 the bar
              cannot hold the logo, five links, the location picker and two
              account buttons on one line — it never could, and the links used
              to overlap the logo there rather than admit it. Below xl the
              drawer carries the same navigation, which is where it belongs. */}
          <Navbar className="hidden min-w-0 flex-1 justify-center xl:flex" />

          {/* Everything the visitor acts on sits together on the right: where
              they are, and their account. */}
          <div className="hidden items-center gap-2.5 xl:flex">
            <LocationPicker />
            <span className="h-6 w-px bg-ink/10" aria-hidden="true" />
            <HeaderAuth />
          </div>

          <button
            type="button"
            onClick={menu.open}
            aria-label="Open menu"
            className="ml-auto grid h-10 w-10 place-items-center rounded-lg text-ink/70 hover:bg-ink/5 xl:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </Container>
    </header>

    {/* Rendered OUTSIDE the header. The header no longer blurs its backdrop,
        but it is still a fixed, stacked element on the home page — keeping the
        drawer out of it is what lets its overlay cover the whole screen. */}
    <MobileMenu isOpen={menu.isOpen} onClose={menu.close} />
    </>
  );
}
