'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * MetaPixelRouteChange — a PageView for every in-app navigation.
 *
 * Meta's base snippet fires PageView once, when the script loads. This site is
 * a single-page app: after the first load, moving between pages never reloads
 * that script, so without this Meta would record one page view per session no
 * matter how much of the site someone actually read.
 *
 * The first render is skipped — the base code in <head> already counted it.
 */
export default function MetaPixelRouteChange() {
  const pathname = usePathname();
  const countedFirst = useRef(false);

  useEffect(() => {
    if (!countedFirst.current) {
      countedFirst.current = true;
      return;
    }
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  return null;
}
