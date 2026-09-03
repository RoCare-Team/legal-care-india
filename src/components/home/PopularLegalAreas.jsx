import Link from 'next/link';
import { Scale, Gavel, Users, Building2, LayoutGrid } from 'lucide-react';
import Container from '@/components/ui/Container';
import { CATEGORIES } from '@/data/categories';
import { cityServicePath } from '@/lib/serviceRoutes';

/**
 * The four areas most matters actually fall under, immediately under the hero.
 *
 * Four, not twelve. This is the shortcut for someone who already knows what
 * their problem is called, and a row of twelve is not a shortcut — it is the
 * same list they would get from "View all", printed twice. The other eight are
 * one tap away and the tile that gets them there is part of the row.
 *
 * On a city page the links stay inside that city, so tapping Criminal Law on
 * /delhi asks for criminal lawyers in Delhi rather than throwing away the city
 * the visitor is already reading.
 *
 * @param {object} props
 * @param {object} [props.city]  { name, state, slug }
 */

/** The four, with the icon each one is drawn with. */
const POPULAR = [
  { slug: 'civil-lawyer', icon: Scale },
  { slug: 'criminal-lawyer', icon: Gavel },
  { slug: 'family-lawyer', icon: Users },
  { slug: 'property-lawyer', icon: Building2 },
];

export default function PopularLegalAreas({ city }) {
  const areas = POPULAR.map(({ slug, icon }) => {
    const category = CATEGORIES.find((c) => c.slug === slug);
    return category ? { category, icon } : null;
  }).filter(Boolean);

  if (areas.length === 0) return null;

  return (
    <section className="bg-muted/40 pt-7 sm:pt-9">
      <Container>
        <p className="mb-3 text-sm font-semibold text-ink/70">Popular legal areas</p>

        {/* One line that scrolls on a phone rather than a grid that wraps. Five
            tiles wrapping onto two rows put a single stranded tile under four,
            which reads as a mistake; scrolling keeps the row a row. */}
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
          {areas.map(({ category, icon: Icon }) => (
            <Link
              key={category.slug}
              href={city ? cityServicePath(category, city) : `/${category.slug}`}
              className="group flex shrink-0 items-center gap-2.5 rounded-xl border border-ink/10 bg-surface px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-card"
            >
              <Icon
                className="h-[18px] w-[18px] shrink-0 text-primary transition-colors group-hover:text-primary-dark"
                aria-hidden="true"
              />
              <span className="whitespace-nowrap text-[13.5px] font-semibold text-ink">
                {category.name}
              </span>
            </Link>
          ))}

          {/* The way to the other eight, in the row rather than beside it — it
              is one more thing you can tap here, and it belongs with them. */}
          <Link
            href={city ? `/legal-services` : '/legal-services'}
            className="group flex shrink-0 items-center gap-2.5 rounded-xl border border-ink/10 bg-surface px-4 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-card"
          >
            <LayoutGrid
              className="h-[18px] w-[18px] shrink-0 text-ink/45 transition-colors group-hover:text-primary"
              aria-hidden="true"
            />
            <span className="whitespace-nowrap text-[13.5px] font-semibold text-ink">
              View all
            </span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
