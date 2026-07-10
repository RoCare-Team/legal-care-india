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

/** Flat list of service names, handy for form selects and filters. */
export const LEGAL_SERVICE_NAMES = CATEGORIES.map((c) => c.name);

/** Look up a single legal service by its slug. */
export function getServiceBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug) || null;
}

/**
 * Sub-specializations for each legal service, keyed by the service NAME.
 * Advocates pick a broad service (e.g. "Criminal Law") and then the specific
 * matters they handle under it. Used by registration and the profile.
 */
export const SUB_SERVICES = {
  'Civil Law': [
    'Property Disputes', 'Contract Disputes', 'Recovery Suits', 'Injunction Suits',
    'Partition Suits', 'Specific Performance', 'Land Acquisition', 'Easement Rights',
    'Defamation', 'Money Recovery',
  ],
  'Criminal Law': [
    'Bail Matters', 'Anticipatory Bail', 'Cyber Crime', 'White Collar Crime',
    'Domestic Violence', 'NDPS / Drug Offences', 'Cheque Bounce (NI Act)',
    'FIR Quashing', 'Criminal Appeals', 'Economic Offences', 'POCSO', 'Murder / Assault',
  ],
  'Family Law': [
    'Divorce', 'Mutual Consent Divorce', 'Child Custody', 'Maintenance & Alimony',
    'Domestic Violence', 'Adoption', 'Guardianship', 'Succession & Inheritance',
    'Restitution of Conjugal Rights', 'Marriage Registration',
  ],
  'Property Law': [
    'Property Registration', 'Title Verification', 'Sale / Purchase Agreements',
    'Tenancy & Eviction', 'Partition', 'Mutation', 'Encroachment', 'Gift & Will Deeds',
    'Property Tax', 'Lease Agreements',
  ],
  'Corporate Law': [
    'Company Incorporation', 'Contracts & Agreements', 'Mergers & Acquisitions',
    'Compliance & Secretarial', 'Shareholder Disputes', 'Due Diligence',
    'Startups & Funding', 'Insolvency (IBC)', 'Joint Ventures', 'Arbitration',
  ],
  'Tax Law': [
    'Income Tax', 'GST', 'Tax Appeals', 'Tax Assessment', 'TDS Matters',
    'Customs & Excise', 'International Taxation', 'Tax Planning', 'Tax Refunds',
  ],
  'Labour & Employment': [
    'Wrongful Termination', 'Employment Contracts', 'Industrial Disputes',
    'Provident Fund / ESI', 'Sexual Harassment (POSH)', 'Gratuity & Compensation',
    'Trade Union Matters', 'Wage Disputes',
  ],
  'Constitutional Law': [
    'Writ Petitions', 'Public Interest Litigation (PIL)', 'Fundamental Rights',
    'Service Matters', 'Election Disputes', 'Habeas Corpus', 'Judicial Review',
  ],
  'Consumer Law': [
    'Consumer Complaints', 'Product Liability', 'Medical Negligence',
    'Insurance Claims', 'E-commerce Disputes', 'Unfair Trade Practices',
    'Deficiency in Service', 'Banking Disputes',
  ],
  'Intellectual Property': [
    'Trademark Registration', 'Copyright', 'Patents', 'Design Registration',
    'IP Litigation', 'Licensing & Assignment', 'Trade Secrets', 'IP Infringement',
  ],
  'Real Estate / RERA': [
    'RERA Complaints', 'Builder-Buyer Disputes', 'Possession Delays', 'Refund Claims',
    'Title Due Diligence', 'Lease & Rent Agreements', 'Redevelopment', 'Society Matters',
  ],
  'Immigration Law': [
    'Visa Applications', 'Work Permits', 'Citizenship', 'PIO / OCI',
    'Passport Matters', 'Deportation', 'Student Visa', 'Permanent Residency',
  ],
};

/** Sub-specializations for a given service name (empty array if none). */
export function getSubServices(name) {
  return SUB_SERVICES[name] || [];
}
