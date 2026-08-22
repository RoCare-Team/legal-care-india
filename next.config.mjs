/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

/**
 * Content-Security-Policy — applied in production only (dev/HMR needs eval + ws).
 * Allows: self, inline styles/scripts (Next hydration + JSON-LD), images from
 * any HTTPS host + data/blob (base64 photos, Wikimedia), Google Analytics, and
 * the Google Maps embed on advocate profiles.
 *
 * `connect-src` also lists stun:/turn:/turns: — Chrome checks ICE server URLs
 * against it, so the video call cannot negotiate without them. `media-src`
 * covers the blob: streams the <video> elements play.
 */
const csp = [
  "default-src 'self'",
  // Razorpay Checkout and the Meta Pixel are both third-party scripts the
  // browser refuses to run unless named here. Leaving Razorpay out is not a
  // subtle failure: the checkout sheet never opens and no one can add money.
  // The wildcard is deliberate: checkout.js pulls more of Razorpay's own hosts
  // as it runs (cdn. for risk detection, checkout-static-next. for the sheet),
  // and naming them one by one breaks the next time they add another.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://*.razorpay.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: mediastream:",
  // Razorpay: api. is the payment API, lumberjack. is its telemetry — checkout
  // treats a blocked telemetry call as a fatal error, so it has to be allowed.
  "connect-src 'self' blob: stun: turn: turns: https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://api.razorpay.com https://lumberjack.razorpay.com https://*.razorpay.com https://connect.facebook.net https://www.facebook.com",
  // Checkout runs inside an iframe, and bank/UPI pages open in nested ones.
  "frame-src 'self' https://www.google.com https://maps.google.com https://www.youtube.com https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://*.rzp.io",
  "object-src 'none'",
  "base-uri 'self'",
  // Netbanking and card flows POST the user out to the bank through Razorpay,
  // which a bare 'self' would block at the last step of a real payment.
  "form-action 'self' https://api.razorpay.com https://*.razorpay.com",
  "frame-ancestors 'self'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // camera + microphone are granted to our own origin so the consultation
  // video call can ask for them; the browser still prompts the user.
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
  ...(isProd ? [{ key: 'Content-Security-Policy', value: csp }] : []),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Normally `.next`. A build wipes and rewrites this directory, so running one
  // while `next dev` is serving from it leaves the dev server reading files
  // that no longer exist (ENOENT on the manifests, half-written .tmp chunks).
  // Setting NEXT_DIST_DIR sends a build somewhere else so the two can coexist.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Pin the workspace root to this project (avoids picking up a parent lockfile).
  outputFileTracingRoot: import.meta.dirname,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // The public directory moved from /advocates to /lawyers. Permanently
  // redirect old links (bookmarks, indexed pages) to the new path.
  async redirects() {
    return [
      { source: '/advocates', destination: '/lawyers', permanent: true },
      { source: '/advocates/:path*', destination: '/lawyers/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
