'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

/**
 * MetaPixel — Facebook/Meta Pixel, loaded only when the env var is set (so
 * nothing tracks in local/dev by default).
 *
 * Set in .env:
 *   NEXT_PUBLIC_META_PIXEL_ID = "1377884663845359"
 *
 * A client component rather than a plain script tag for one reason: Meta's
 * snippet fires PageView once, on script load. This site is a single-page app,
 * so every route change after that would go uncounted — Meta would report one
 * page view per session. The effect below fires PageView on each navigation
 * instead, skipping the first (the snippet already covered it).
 *
 * /admin is excluded. That traffic is the site owner's own, and feeding it to
 * Meta only pollutes the audiences built from real visitors.
 */
export default function MetaPixel() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const pathname = usePathname();
  const isAdmin = Boolean(pathname?.startsWith('/admin'));
  const enabled = Boolean(pixelId) && !isAdmin;

  // First render is the snippet's own PageView; only later navigations need one.
  const seenFirst = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!seenFirst.current) {
      seenFirst.current = true;
      return;
    }
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname, enabled]);

  if (!enabled) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
      </Script>

      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
