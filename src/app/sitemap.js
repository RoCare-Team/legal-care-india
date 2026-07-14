import { SITE } from '@/constants/site';
import { CATEGORIES } from '@/data/categories';
import { getAllCities } from '@/lib/cities';
import { getAllAdvocateParams } from '@/lib/advocates';
import { BLOGS } from '@/data/blogs';

/**
 * Dynamic sitemap. Next.js serves this at /sitemap.xml.
 * Extend the source arrays (or swap for API calls) and the sitemap scales
 * automatically as the directory grows.
 *
 * @returns {import('next').MetadataRoute.Sitemap}
 */
export default async function sitemap() {
  const now = new Date('2026-07-06');
  const base = SITE.url;

  const staticRoutes = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' },
    { path: '/advocates', priority: 0.9, changeFrequency: 'daily' },
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
    url: new URL(`/legal-services/${c.slug}`, base).toString(),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
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

  const advocateParams = await getAllAdvocateParams();
  const advocateRoutes = advocateParams.map((param) => ({
    url: new URL(`/advocates/${param}`, base).toString(),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const blogRoutes = BLOGS.map((p) => ({
    url: new URL(`/blogs/${p.slug}`, base).toString(),
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...categoryRoutes, ...cityRoutes, ...advocateRoutes, ...blogRoutes];
}
