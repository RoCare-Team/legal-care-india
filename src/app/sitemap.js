import { SITE } from '@/constants/site';
import { CATEGORIES, getSubServiceLinks } from '@/data/categories';
import {
  servicePath, matterPath, cityServicePath, cityMatterPath,
} from '@/lib/serviceRoutes';
import { getAllCities } from '@/lib/cities';
import { getAllAdvocateParams } from '@/lib/advocates';
import { getAllBlogs } from '@/lib/blogs';
import { NOINDEX } from '@/lib/noindex';

/**
 * Dynamic sitemap. Next.js serves this at /sitemap.xml.
 * Extend the source arrays (or swap for API calls) and the sitemap scales
 * automatically as the directory grows.
 *
 * While SITE_NOINDEX is on the sitemap is served empty — handing crawlers a
 * list of every URL is the opposite of what the switch is for.
 *
 * @returns {import('next').MetadataRoute.Sitemap}
 */
export default async function sitemap() {
  if (NOINDEX) return [];

  const now = new Date('2026-07-06');
  const base = SITE.url;

  const staticRoutes = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' },
    { path: '/lawyers', priority: 0.9, changeFrequency: 'daily' },
    { path: '/legal-services', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/cities', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/blogs', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/register', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/login', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/verification', priority: 0.4, changeFrequency: 'monthly' },
    { path: '/success-stories', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/careers', priority: 0.3, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/disclaimer', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/refund', priority: 0.3, changeFrequency: 'yearly' },
  ].map((route) => ({
    url: new URL(route.path, base).toString(),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const categoryRoutes = CATEGORIES.map((c) => ({
    url: new URL(servicePath(c), base).toString(),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // One entry per specific matter (e.g. /bail-matters-lawyer).
  const matters = CATEGORIES.flatMap((c) =>
    getSubServiceLinks(c.name).map((s) => ({ subSlug: s.slug }))
  );
  const matterRoutes = matters.map(({ subSlug }) => ({
    url: new URL(matterPath(subSlug), base).toString(),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // City routes carry their landmark image (image sitemap extension).
  const cities = await getAllCities();
  const cityRoutes = cities.map((c) => ({
    url: new URL(`/${c.slug}`, base).toString(),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
    ...(c.image ? { images: [c.image] } : {}),
  }));

  // The city-scoped long tail: every service and every matter, per city.
  const cityCategoryRoutes = cities.flatMap((city) =>
    CATEGORIES.map((c) => ({
      url: new URL(cityServicePath(c, city), base).toString(),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  );
  const cityMatterRoutes = cities.flatMap((city) =>
    matters.map(({ subSlug }) => ({
      url: new URL(cityMatterPath(subSlug, city), base).toString(),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    }))
  );

  const advocateParams = await getAllAdvocateParams();
  const advocateRoutes = advocateParams.map((param) => ({
    url: new URL(`/lawyers/${param}`, base).toString(),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const blogPosts = await getAllBlogs();
  const blogRoutes = blogPosts.map((p) => ({
    url: new URL(`/blogs/${p.slug}`, base).toString(),
    lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...matterRoutes,
    ...cityRoutes,
    ...cityCategoryRoutes,
    ...cityMatterRoutes,
    ...advocateRoutes,
    ...blogRoutes,
  ];
}
