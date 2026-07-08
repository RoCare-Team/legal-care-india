'use client';

import { ArrowUp } from 'lucide-react';
import { useScrollPosition } from '@/hooks/useScrollPosition';

/**
 * ScrollToTop — a floating button that appears after the user scrolls down
 * and smoothly returns them to the top of the page. Uses CSS transitions
 * (no Framer Motion) to keep the bundle small.
 */
export default function ScrollToTop() {
  const scrollY = useScrollPosition();
  const visible = scrollY > 480;

  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      type="button"
      onClick={scrollUp}
      aria-label="Scroll back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-40 grid h-11 w-11 place-items-center rounded-full bg-primary text-white shadow-card-hover transition-all duration-200 hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'pointer-events-none translate-y-3 scale-90 opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
