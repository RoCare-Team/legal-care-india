import { SITE } from '@/constants/site';
import { COLORS } from '@/constants/colors';

/**
 * PWA web app manifest. Next.js serves this at /manifest.webmanifest.
 *
 * @returns {import('next').MetadataRoute.Manifest}
 */
export default function manifest() {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: COLORS.primary,
    // Uses the scalable SVG icon served by the App Router (src/app/icon.svg),
    // so there are no missing PNG assets to 404.
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
