import {
  Scale,
  Home,
  Users,
  Briefcase,
  Landmark,
  ShieldCheck,
  FileText,
  Building2,
  HeartHandshake,
  Gavel,
  Globe2,
  Coins,
} from 'lucide-react';

/**
 * Legal services surfaced across the directory.
 * `icon` is a Lucide component reference (rendered by the consuming component).
 */
export const CATEGORIES = [
  { slug: 'civil-law', name: 'Civil Law', icon: Scale, advocates: 4200, description: 'Property, contracts and civil disputes.' },
  { slug: 'criminal-law', name: 'Criminal Law', icon: Gavel, advocates: 3800, description: 'Bail, defense and criminal proceedings.' },
  { slug: 'family-law', name: 'Family Law', icon: Users, advocates: 3100, description: 'Divorce, custody and maintenance.' },
  { slug: 'property-law', name: 'Property Law', icon: Home, advocates: 2900, description: 'Registration, disputes and tenancy.' },
  { slug: 'corporate-law', name: 'Corporate Law', icon: Briefcase, advocates: 2400, description: 'Company, compliance and contracts.' },
  { slug: 'tax-law', name: 'Tax Law', icon: Coins, advocates: 1700, description: 'Income tax, GST and appeals.' },
  { slug: 'labour-law', name: 'Labour & Employment', icon: HeartHandshake, advocates: 1500, description: 'Workplace and employment matters.' },
  { slug: 'constitutional-law', name: 'Constitutional Law', icon: Landmark, advocates: 900, description: 'Writs, PILs and fundamental rights.' },
  { slug: 'consumer-law', name: 'Consumer Law', icon: ShieldCheck, advocates: 1300, description: 'Consumer complaints and redressal.' },
  { slug: 'intellectual-property', name: 'Intellectual Property', icon: FileText, advocates: 800, description: 'Trademark, copyright and patents.' },
  { slug: 'real-estate', name: 'Real Estate / RERA', icon: Building2, advocates: 1100, description: 'RERA, builder and buyer disputes.' },
  { slug: 'immigration-law', name: 'Immigration Law', icon: Globe2, advocates: 600, description: 'Visa, citizenship and travel matters.' },
];

/** Preferred alias — "Legal Services" is the platform-wide term. */
export const LEGAL_SERVICES = CATEGORIES;

/** Flat list of service names, handy for form selects and filters. */
export const LEGAL_SERVICE_NAMES = CATEGORIES.map((c) => c.name);

/** Look up a single legal service by its slug. */
export function getServiceBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug) || null;
}
