'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * SectionReveal — reusable scroll-into-view fade/slide animation wrapper.
 *
 * Uses a tiny IntersectionObserver + CSS transition instead of Framer Motion,
 * so it adds virtually no JavaScript to the bundle. The content is present in
 * the server-rendered HTML from the start (good for SEO); it simply fades in
 * once scrolled into view. Without JS it stays fully visible.
 *
 * @param {object} props
 * @param {number} [props.delay=0]   entrance delay in seconds
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
export default function SectionReveal({ delay = 0, className = '', children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '-80px', threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
