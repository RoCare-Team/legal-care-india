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
import { slugify } from '@/utils/slugify';

/**
 * Legal services surfaced across the directory.
 * `icon` is a Lucide component reference (rendered by the consuming component).
 */
export const CATEGORIES = [
  {
    slug: 'civil-law', name: 'Civil Law', icon: Scale, advocates: 4200,
    description: 'Property, contracts and civil disputes.',
    overview:
      'Civil law covers disputes between individuals or organisations — property, money recovery, contracts, injunctions and more. A civil lawyer helps you file or defend suits, draft notices and represent you before civil courts to protect your rights and interests.',
  },
  {
    slug: 'criminal-law', name: 'Criminal Law', icon: Gavel, advocates: 3800,
    description: 'Bail, defense and criminal proceedings.',
    overview:
      'Criminal law deals with offences against the state and society — from bail and FIR quashing to trial defence and appeals. A criminal lawyer protects your rights at every stage, from police station to the highest court, and builds a strong defence strategy.',
  },
  {
    slug: 'family-law', name: 'Family Law', icon: Users, advocates: 3100,
    description: 'Divorce, custody and maintenance.',
    overview:
      'Family law handles sensitive personal matters like divorce, child custody, maintenance, adoption and inheritance. A family lawyer guides you through the emotional and legal process with confidentiality, aiming for a fair and timely resolution.',
  },
  {
    slug: 'property-law', name: 'Property Law', icon: Home, advocates: 2900,
    description: 'Registration, disputes and tenancy.',
    overview:
      'Property law covers buying, selling, registration, title verification, tenancy and property disputes. A property lawyer ensures your transactions are legally sound, verifies ownership and helps resolve encroachment, partition and eviction matters.',
  },
  {
    slug: 'corporate-law', name: 'Corporate Law', icon: Briefcase, advocates: 2400,
    description: 'Company, compliance and contracts.',
    overview:
      'Corporate law supports businesses with incorporation, contracts, compliance, mergers, funding and dispute resolution. A corporate lawyer helps you set up, run and grow your company while staying compliant and protecting your commercial interests.',
  },
  {
    slug: 'tax-law', name: 'Tax Law', icon: Coins, advocates: 1700,
    description: 'Income tax, GST and appeals.',
    overview:
      'Tax law covers income tax, GST, assessments, notices and appeals. A tax lawyer helps you respond to departmental notices, file appeals, plan your taxes lawfully and represent you before tax authorities and tribunals.',
  },
  {
    slug: 'labour-law', name: 'Labour & Employment', icon: HeartHandshake, advocates: 1500,
    description: 'Workplace and employment matters.',
    overview:
      'Labour and employment law deals with workplace rights — wrongful termination, employment contracts, PF/ESI, industrial disputes and harassment. A lawyer protects both employees and employers and ensures fair, compliant workplace practices.',
  },
  {
    slug: 'constitutional-law', name: 'Constitutional Law', icon: Landmark, advocates: 900,
    description: 'Writs, PILs and fundamental rights.',
    overview:
      'Constitutional law protects your fundamental rights through writ petitions, PILs and challenges to government action. A constitutional lawyer takes matters to the High Courts and Supreme Court to enforce rights and hold authorities accountable.',
  },
  {
    slug: 'consumer-law', name: 'Consumer Law', icon: ShieldCheck, advocates: 1300,
    description: 'Consumer complaints and redressal.',
    overview:
      'Consumer law helps you fight defective products, deficient services, unfair trade practices and false claims. A consumer lawyer files complaints before consumer forums and helps you recover refunds, replacements and compensation.',
  },
  {
    slug: 'intellectual-property', name: 'Intellectual Property', icon: FileText, advocates: 800,
    description: 'Trademark, copyright and patents.',
    overview:
      'Intellectual property law protects your brand, creations and inventions — trademarks, copyrights, patents and designs. An IP lawyer handles registration, licensing and infringement action so your ideas stay legally protected.',
  },
  {
    slug: 'real-estate', name: 'Real Estate / RERA', icon: Building2, advocates: 1100,
    description: 'RERA, builder and buyer disputes.',
    overview:
      'Real estate and RERA law protects homebuyers and investors against project delays, possession issues and builder defaults. A RERA lawyer files complaints, claims refunds with interest and holds developers accountable under the RERA Act.',
  },
  {
    slug: 'immigration-law', name: 'Immigration Law', icon: Globe2, advocates: 600,
    description: 'Visa, citizenship and travel matters.',
    overview:
      'Immigration law covers visas, work permits, citizenship, OCI/PIO and passport matters. An immigration lawyer guides you through applications, documentation and appeals for smooth and lawful travel, work and residency.',
  },
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

/** Sub-services for a service as { name, slug } objects (for links). */
export function getSubServiceLinks(name) {
  return getSubServices(name).map((s) => ({ name: s, slug: slugify(s) }));
}

/** Find a sub-service by its slug within a given service name, or null. */
export function getSubServiceBySlug(serviceName, subSlug) {
  return getSubServices(serviceName).find((s) => slugify(s) === subSlug) || null;
}

/** Every valid { categorySlug, subSlug } pair — used for static params. */
export function getAllSubServiceParams() {
  return CATEGORIES.flatMap((c) =>
    getSubServices(c.name).map((s) => ({ slug: c.slug, sub: slugify(s) }))
  );
}
