import fs from 'node:fs';
import path from 'node:path';
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

/**
 * The real brand lockup, inlined as a data URL.
 *
 * `ImageResponse` renders on the server with no page to resolve relative URLs
 * against, so a plain `/logo4.png` would not load. Read once at module scope
 * rather than per request — the file never changes between deploys.
 */
const LOGO = `data:image/png;base64,${fs
  .readFileSync(path.join(process.cwd(), 'public', 'logo5.jpeg'))
  .toString('base64')}`;

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
        {/* On a white plate: the lockup is navy and gold, and navy on this
            navy gradient would be half a logo. The wordmark is part of the
            artwork, so the name is not set again in type beside it.

            `alignSelf` keeps the plate the width of its contents — a column
            flex parent would otherwise stretch it the full 1200px. The inner
            box crops the file's empty margin the same way the Logo component
            does, so the artwork fills the plate instead of floating in a
            corner of it. */}
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            background: '#ffffff',
            borderRadius: 18,
            padding: '20px 26px',
          }}
        >
          <div style={{ display: 'flex', position: 'relative', width: 340, height: 82, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO}
              alt=""
              width={364}
              height={178}
              style={{ position: 'absolute', left: -15, top: -45 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 62, fontWeight: 800, lineHeight: 1.12, marginTop: 44 }}>
          Get Anonymous Legal Help in Just 10 Minutes
        </div>

        <div style={{ display: 'flex', fontSize: 28, color: '#D4AF37', marginTop: 26, maxWidth: 940 }}>
          Discover, compare and connect with verified lawyers by legal service, city and experience.
        </div>
      </div>
    ),
    { ...size }
  );
}
