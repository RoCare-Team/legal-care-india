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
 * against, so a plain `/logo1.png` would not load. Read once at module scope
 * rather than per request — the file never changes between deploys.
 */
const LOGO = `data:image/png;base64,${fs
  .readFileSync(path.join(process.cwd(), 'public', 'logo1.png'))
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
            corner of it.

            Every number below comes from one scale factor, which is what keeps
            the logo from being stretched. logo1.png is 2061×512 with its
            artwork inside x 82–1968, y 105–432 — 1886 × 327. Showing that
            1886px-wide region in a 380px box is a scale of 380/1886 = 0.2015,
            so the whole file draws at 2061 × 0.2015 = 415 wide by 512 × 0.2015
            = 103 tall, shifted up and left by the margin's own scaled size.
            The box's 66px height is 327 × 0.2015 — the artwork's height at
            that same scale, not a figure chosen to make it fit. */}
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            background: '#ffffff',
            borderRadius: 18,
            padding: '20px 26px',
          }}
        >
          <div style={{ display: 'flex', position: 'relative', width: 380, height: 66, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO}
              alt=""
              width={415}
              height={103}
              style={{ position: 'absolute', left: -16.5, top: -21.2 }}
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
