'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

/**
 * LazyMap — the office's Google map, attached only once it is nearly on screen.
 *
 * The embed is Google's whole Maps application in an iframe — its scripts,
 * tiles and fonts. As a plain iframe it began loading with the page, even though
 * the Office section sits a long scroll below the header, and the profile was
 * not "loaded" for about six seconds while the browser fetched a map nobody had
 * reached. `loading="lazy"` alone did not stop it: browsers start lazy iframes a
 * long way before they come into view.
 *
 * Until then a placeholder of the same size holds the space, so nothing on the
 * page moves when the map arrives.
 *
 * @param {object} props
 * @param {string} props.src    the embed URL
 * @param {string} props.title  accessible name for the iframe
 */
export default function LazyMap({ src, title }) {
  const holder = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = holder.current;
    if (!el || show) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  return (
    <div ref={holder} className="relative h-64 w-full bg-[#EEF2F8]">
      {show ? (
        <iframe
          title={title}
          src={src}
          className="h-full w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-ink/35" aria-hidden="true">
          <MapPin className="h-7 w-7" />
        </div>
      )}
    </div>
  );
}
