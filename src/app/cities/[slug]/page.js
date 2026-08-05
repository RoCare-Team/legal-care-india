import { permanentRedirect } from 'next/navigation';

// City pages now live at the short, canonical URL `/[city]` (e.g. /delhi).
// Old `/cities/[slug]` links permanently redirect there — 308, not the 307
// `redirect()` sends: this move is permanent, and a temporary redirect leaves
// search engines indexing the old path indefinitely.
export default async function LegacyCityRedirect({ params }) {
  const { slug } = await params;
  permanentRedirect(`/${slug}`);
}
