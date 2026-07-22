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
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: mediastream:",
  "connect-src 'self' blob: stun: turn: turns: https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com",
  "frame-src 'self' https://www.google.com https://maps.google.com https://www.youtube.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
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
