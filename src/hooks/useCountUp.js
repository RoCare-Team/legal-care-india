'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animate a number from 0 to `end` once the element scrolls into view.
 * Respects prefers-reduced-motion by snapping to the final value.
 *
 * @param {number} end        Target value
 * @param {number} [duration] Animation duration in ms
 * @returns {[number, import('react').RefObject<HTMLElement>]} [value, ref]
 */
export function useCountUp(end, duration = 1600) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(end);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(end * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [end, duration]);

  return [value, ref];
}
