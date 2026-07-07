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
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
