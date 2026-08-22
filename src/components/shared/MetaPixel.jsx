import { activeMetaPixelId } from '@/constants/site';

/**
 * MetaPixel — the base pixel code, exactly as Meta ships it.
 *
 * A server component, rendered inside <head> in the root layout, so the
 * snippet is in the HTML the browser receives rather than injected later by
 * React. That is what Meta's install instructions ask for, and it matters:
 * loaded after hydration, the pixel misses anyone who leaves before the page
 * finishes booting — exactly the visitors an ad campaign is paying for.
 *
 * The id comes from constants/site (committed, because it is public and a
 * gitignored .env is how it went missing in production once already).
 *
 * This fires PageView once, on load. Route changes are a separate job — a
 * single-page app never reloads this script — handled by MetaPixelRouteChange.
 */
export default function MetaPixel() {
  const pixelId = activeMetaPixelId;
  if (!pixelId) return null;

  return (
    <script
      id="meta-pixel"
      dangerouslySetInnerHTML={{
        __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`,
      }}
    />
  );
}

/**
 * The no-JavaScript fallback. Belongs in <body>: a <noscript> in <head> may
 * only hold link/style/meta, so an <img> there is invalid HTML.
 */
export function MetaPixelNoscript() {
  const pixelId = activeMetaPixelId;
  if (!pixelId) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        alt=""
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
}
