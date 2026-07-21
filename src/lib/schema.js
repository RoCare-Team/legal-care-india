import { SITE } from '@/constants/site';
import { advocateProfilePath } from '@/utils/advocateUrl';

/** Absolute URL from a root-relative path. */
export function abs(path = '/') {
  return new URL(path, SITE.url).toString();
}

/** Reusable Organization node (referenced by other schemas). */
export const organizationNode = {
  '@type': 'Organization',
  '@id': `${SITE.url}/#organization`,
  name: SITE.name,
  url: SITE.url,
  logo: abs('/icon.svg'),
};

/**
 * BreadcrumbList — shows the breadcrumb trail in search results.
 * @param {Array<{name:string, path?:string}>} items
 */
export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(it.path ? { item: abs(it.path) } : {}),
    })),
  };
}

/** BlogPosting/Article schema for a blog post. */
export function articleSchema(post) {
  let datePublished;
  try {
    if (post.date) datePublished = new Date(post.date).toISOString();
  } catch {
    datePublished = undefined;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    articleSection: post.category,
    ...(datePublished ? { datePublished, dateModified: datePublished } : {}),
    author: organizationNode,
    publisher: organizationNode,
    inLanguage: 'en-IN',
    mainEntityOfPage: { '@type': 'WebPage', '@id': abs(`/blogs/${post.slug}`) },
    url: abs(`/blogs/${post.slug}`),
  };
}

/** Service schema for a legal-service category page. */
export function serviceSchema(service) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.name,
    name: `${service.name} Lawyers`,
    description: service.description,
    provider: organizationNode,
    areaServed: { '@type': 'Country', name: 'India' },
    url: abs(`/legal-services/${service.slug}`),
  };
}

/**
 * CollectionPage + ItemList — helps search engines understand a directory
 * listing of lawyers.
 * @param {{name:string, path:string, description?:string, advocates:Array}} opts
 */
export function collectionSchema({ name, path, description, advocates = [] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: abs(path),
    isPartOf: { '@id': `${SITE.url}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: advocates.length,
      itemListElement: advocates.slice(0, 20).map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: abs(`/lawyers/${advocateProfilePath(a)}`),
        name: a.name,
      })),
    },
  };
}

/** Generic WebPage node (About/Contact/etc.). */
export function webPageSchema({ type = 'WebPage', name, description, path }) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    url: abs(path),
    isPartOf: { '@id': `${SITE.url}/#website` },
    publisher: { '@id': `${SITE.url}/#organization` },
    inLanguage: 'en-IN',
  };
}

/** FAQPage schema from an array of { q, a } (or { question, answer }). */
export function faqSchema(faqs = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q || f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.a || f.answer },
    })),
  };
}

/** SiteNavigationElement — exposes the primary nav to search engines. */
export function siteNavigationSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    name: items.map((i) => i.label),
    url: items.map((i) => abs(i.href)),
  };
}
