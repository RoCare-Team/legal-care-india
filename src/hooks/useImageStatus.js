'use client';

import { useCallback, useState } from 'react';

/**
 * Where one image has got to: 'loading', 'loaded' or 'error'.
 *
 * onLoad / onError alone are not enough for a server-rendered image: the
 * browser can finish — or fail — fetching it before React hydrates and
 * attaches those handlers, and the event is then never seen, leaving a loader
 * spinning over nothing. The ref looks at the element the moment it is
 * attached and settles the status from what has already happened.
 *
 * Keyed to the URL, so a new photo starts loading afresh.
 *
 * @param {string} src
 * @returns {{ status: string, ref: Function, onLoad: Function, onError: Function }}
 */
export default function useImageStatus(src) {
  const [state, setState] = useState({ src, status: 'loading' });
  const status = state.src === src ? state.status : 'loading';
  if (state.src !== src) setState({ src, status: 'loading' });

  // A no-op when nothing changes. next/image hands its <img> a fresh merged
  // ref on every render, so `ref` below runs on every render too; setting a
  // new-but-equal state there would re-render, re-run the ref, and loop.
  const settle = useCallback(
    (next) =>
      setState((prev) => (prev.src === src && prev.status === next ? prev : { src, status: next })),
    [src]
  );

  const ref = useCallback(
    (img) => {
      if (img?.complete) settle(img.naturalWidth > 0 ? 'loaded' : 'error');
    },
    [settle]
  );

  return { status, ref, onLoad: () => settle('loaded'), onError: () => settle('error') };
}
