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
      {/* The page's own gutter, so the logo lines up with the headings below
          it. Widening the bar to stop the last control overflowing worked, but
          the extra 128px became slack the centred nav split evenly on either
          side — the fix for a crowded bar had left it looking gappy instead.
          Tightening the gaps and the capsule inset bought back more room than
          the widening did, so the width goes back. */}
      <Container>
        <div
          className={cn(
            'flex items-center gap-2 transition-all duration-200 lg:gap-3',
            floating
              // `rounded-full` curves away half the bar's height at each end,
              // so the padding has to clear that curve — at px-4 the Log out
              // button's corner sat outside the white and hung over the hero.
              // Not `overflow-hidden`: the location and account menus drop out
              // of this box, and clipping would cut them off at the bar.
              ? 'h-[64px] rounded-full bg-white px-4 shadow-[0_8px_28px_-10px_rgba(15,23,42,0.45)] ring-1 ring-ink/5 sm:px-6'
              : 'h-[72px]'
          )}
        >
          <Logo />

          <Navbar className="hidden min-w-0 flex-1 justify-center lg:flex" />

          {/* Everything the visitor acts on sits together on the right: where
              they are, and their account. */}
          <div className="hidden items-center gap-2.5 lg:flex">
            <LocationPicker />
            <span className="h-6 w-px bg-ink/10" aria-hidden="true" />
            <HeaderAuth />
          </div>

          <button
            type="button"
            onClick={menu.open}
            aria-label="Open menu"
            className="ml-auto grid h-10 w-10 place-items-center rounded-lg text-ink/70 hover:bg-ink/5 lg:hidden"
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
