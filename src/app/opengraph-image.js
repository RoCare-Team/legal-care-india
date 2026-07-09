import { ImageResponse } from 'next/og';
import { SITE } from '@/constants/site';

/**
 * Dynamically generated social share image (Open Graph + Twitter).
 * Next.js serves this at /opengraph-image and wires up the meta tags for every
 * route automatically — no static PNG to maintain, never a 404.
 */
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #1E3A5F 0%, #142842 55%, #0F172A 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <svg width="88" height="88" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="14" fill="#ffffff" />
            <g fill="none" stroke="#1E3A5F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M32 16v32" />
              <path d="M22 22h20" />
              <path d="M18 24l-6 12h12z" />
              <path d="M46 24l-6 12h12z" />
              <path d="M24 48h16" />
            </g>
          </svg>
          <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>{SITE.name}</span>
        </div>

        <div style={{ display: 'flex', fontSize: 74, fontWeight: 800, lineHeight: 1.1, marginTop: 56 }}>
          Find Verified Advocates Across India
        </div>

        <div style={{ display: 'flex', fontSize: 32, color: '#D4AF37', marginTop: 28, maxWidth: 900 }}>
          Discover, compare and connect with verified advocates by legal service, city and experience.
        </div>
      </div>
    ),
    { ...size }
  );
}
