'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import Container from '@/components/ui/Container';

/**
 * ProfileTabs — the row under the header that moves you down the profile.
 *
 * Tabs, not panels. Everything they point at is already on the page and always
 * has been; a profile is one document a client reads through, and hiding the
 * reviews behind a tab means the one thing most people scroll for is the one
 * thing they have to know to click for. So these scroll rather than switch, and
 * the underline follows whichever section the reader has reached.
 *
 * A tab whose section the lawyer never filled in is not rendered — an
 * Experience tab that jumps nowhere is worse than no Experience tab.
 *
 * @param {object} props
 * @param {Array<{id: string, label: string}>} props.tabs  in page order
 */
export default function ProfileTabs({ tabs }) {
  const [active, setActive] = useState(tabs[0]?.id || '');

  // Which section the reader is in. The rootMargin pins the trigger line a
  // third of the way down the viewport rather than at its top edge: at the top,
  // a section became "current" only once it had already scrolled past, so the
  // underline was always one behind what was on screen.
  useEffect(() => {
    const sections = tabs
      .map((t) => document.getElementById(t.id))
      .filter(Boolean);
    if (sections.length === 0) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-33% 0px -60% 0px', threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [tabs]);

  if (tabs.length < 2) return null;

  return (
    <nav
      aria-label="Profile sections"
      className="sticky top-[72px] z-20 border-b border-ink/8 bg-surface/95 backdrop-blur"
    >
      <Container>
      {/* One line that scrolls on a phone rather than a grid that wraps: five
          tabs on two rows read as two different navigations. */}
      <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === id ? 'true' : undefined}
            className={cn(
              'relative shrink-0 whitespace-nowrap px-3.5 py-3 text-[13.5px] font-semibold transition-colors',
              active === id ? 'text-primary' : 'text-ink/55 hover:text-ink'
            )}
          >
            {label}
            <span
              className={cn(
                'absolute inset-x-2.5 bottom-0 h-[2.5px] rounded-full transition-colors',
                active === id ? 'bg-primary' : 'bg-transparent'
              )}
              aria-hidden="true"
            />
          </a>
        ))}
      </div>
      </Container>
    </nav>
  );
}
