'use client';

import { useEffect, useState } from 'react';

/**
 * Track the vertical scroll position of the window.
 * Uses a passive listener and requestAnimationFrame to stay cheap.
 *
 * @returns {number} current scrollY in pixels
 */
export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrollY(window.scrollY));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return scrollY;
}
