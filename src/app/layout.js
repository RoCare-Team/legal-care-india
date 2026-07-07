import './globals.css';
import { fontVariables } from '@/lib/fonts';
import { baseMetadata } from '@/lib/metadata';
import { SITE } from '@/constants/site';
import { COLORS } from '@/constants/colors';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ScrollToTop from '@/components/shared/ScrollToTop';

/** Root metadata for every route (extend per-page with createMetadata). */
export const metadata = baseMetadata;

export const viewport = {
  themeColor: COLORS.primary,
  width: 'device-width',
  initialScale: 1,
};

/** JSON-LD organization schema for richer search results. */
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
