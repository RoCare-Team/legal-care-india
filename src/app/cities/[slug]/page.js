import { redirect } from 'next/navigation';

// City pages now live at the short, canonical URL `/[city]` (e.g. /delhi).
// Old `/cities/[slug]` links permanently redirect there.
export default async function LegacyCityRedirect({ params }) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
