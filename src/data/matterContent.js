/**
 * A one-line description for every specific matter, keyed by service NAME and
 * then matter NAME — the same keys SUB_SERVICES uses in src/data/categories.js.
 *
 * These lines do two jobs: they fill the matter cards on a practice-area page,
 * so a visitor can tell what a matter actually covers before clicking, and they
 * give each matter page its own opening line instead of a generated sentence.
 *
 * Keep them to one sentence, plain, and about what the matter IS — not a sales
 * pitch. A matter with no entry simply renders without a description.
 */
export const MATTER_DESCRIPTIONS = {
  'Civil Law': {
    'Property Disputes': 'Ownership, possession and boundary fights over land or a building.',
    'Contract Disputes': 'One side has not done what the signed agreement required.',
    'Recovery Suits': 'Court action to recover money, goods or property withheld from you.',
    'Injunction Suits': 'An order restraining someone from selling, building or interfering.',
    'Partition Suits': 'Dividing jointly held or ancestral property between co-owners.',
    'Specific Performance': 'Forcing a seller to complete a sale they agreed to and then backed out of.',
    'Land Acquisition': 'Compensation and challenges when the state acquires your land.',
    'Easement Rights': 'Rights of way, light, air and drainage over a neighbour’s property.',
    Defamation: 'Damages and injunction for statements that harmed your reputation.',
    'Money Recovery': 'Unpaid loans, invoices and advances recovered through a civil suit.',
  },

  'Criminal Law': {
    'Bail Matters': 'Securing release from custody after arrest, on conditions the court sets.',
    'Anticipatory Bail': 'Protection from arrest applied for before it happens.',
    'Cyber Crime': 'Online fraud, hacking, identity theft and offences under the IT Act.',
    'White Collar Crime': 'Fraud, forgery, breach of trust and corporate criminal liability.',
    'Domestic Violence': 'Criminal proceedings arising from cruelty and violence within the home.',
    'NDPS / Drug Offences': 'Narcotics cases, where bail is restricted and quantity decides everything.',
    'Cheque Bounce (NI Act)': 'Section 138 complaints, with strict deadlines for notice and filing.',
    'FIR Quashing': 'Ending a false or baseless FIR through the High Court.',
    'Criminal Appeals': 'Challenging a conviction or sentence before a higher court.',
    'Economic Offences': 'Money laundering, banking fraud and cases before special courts.',
    POCSO: 'Offences against children, tried under a special and strict procedure.',
    'Murder / Assault': 'Serious offences against the person, tried before the Sessions Court.',
  },

  'Family Law': {
    Divorce: 'Ending a marriage on the grounds your personal law allows.',
    'Mutual Consent Divorce': 'A negotiated separation both spouses agree to, with settled terms.',
    'Child Custody': 'Who the child lives with, and on what visitation arrangement.',
    'Maintenance & Alimony': 'Monthly support and one-time settlement between spouses.',
    'Domestic Violence': 'Protection, residence and monetary orders under the 2005 Act.',
    Adoption: 'Legally securing an adoption under the correct statute.',
    Guardianship: 'Appointment of a guardian for a minor’s person or property.',
    'Succession & Inheritance': 'Establishing who inherits, and in what share.',
    'Restitution of Conjugal Rights': 'A petition seeking the return of a spouse who has withdrawn.',
    'Marriage Registration': 'Registering a marriage, including under the Special Marriage Act.',
  },

  'Property Law': {
    'Property Registration': 'Stamp duty, execution and registration before the Sub-Registrar.',
    'Title Verification': 'Tracing the ownership chain before you pay for a property.',
    'Sale / Purchase Agreements': 'Drafting terms that protect you if the deal goes wrong.',
    'Tenancy & Eviction': 'Rent, notice and eviction under your state’s rent-control law.',
    Partition: 'Dividing co-owned property by deed or through the court.',
    Mutation: 'Getting revenue records updated into your name.',
    Encroachment: 'Removing an unauthorised occupation of your land.',
    'Gift & Will Deeds': 'Transferring property within the family, in a form that holds.',
    'Property Tax': 'Assessment disputes and arrears with the municipal authority.',
    'Lease Agreements': 'Long-term and commercial leases, drafted and registered properly.',
  },

  'Corporate Law': {
    'Company Incorporation': 'Setting up a private limited, LLP or OPC and its founding documents.',
    'Contracts & Agreements': 'Drafting and negotiating the commercial contracts a business signs.',
    'Mergers & Acquisitions': 'Buying, selling or merging a business, from term sheet to closing.',
    'Compliance & Secretarial': 'Annual ROC filings, board processes and regularising past defaults.',
    'Shareholder Disputes': 'Oppression and mismanagement petitions before the NCLT.',
    'Due Diligence': 'Examining a target company’s legal position before you invest.',
    'Startups & Funding': 'Term sheets, SHAs, ESOPs and investor documentation.',
    'Insolvency (IBC)': 'Corporate insolvency and recovery proceedings under the IBC.',
    'Joint Ventures': 'Structuring a partnership between two businesses, and its exit.',
    Arbitration: 'Resolving a commercial dispute outside court, under the contract’s clause.',
  },

  'Tax Law': {
    'Income Tax': 'Scrutiny, reassessment and demands under the Income Tax Act.',
    GST: 'Registration, audits, classification and input tax credit disputes.',
    'Tax Appeals': 'Appeals before CIT(A), the ITAT and the High Court.',
    'Tax Assessment': 'Representation through the assessment proceedings themselves.',
    'TDS Matters': 'Deduction defaults, mismatches and TDS demands.',
    'Customs & Excise': 'Classification, valuation and duty disputes on imports and exports.',
    'International Taxation': 'Cross-border income, DTAA relief and transfer pricing.',
    'Tax Planning': 'Structuring a transaction lawfully, before it is executed.',
    'Tax Refunds': 'Recovering refunds that have been withheld or adjusted.',
  },

  'Labour & Employment': {
    'Wrongful Termination': 'Challenging a dismissal made without cause or due procedure.',
    'Employment Contracts': 'Drafting and reviewing appointment letters and exit documents.',
    'Industrial Disputes': 'Conciliation and adjudication before the Labour Court.',
    'Provident Fund / ESI': 'Unremitted contributions and disputes with the authorities.',
    'Sexual Harassment (POSH)': 'Internal Committee inquiries and appeals under the POSH Act.',
    'Gratuity & Compensation': 'Recovering gratuity, severance and terminal dues.',
    'Trade Union Matters': 'Registration, recognition and collective bargaining disputes.',
    'Wage Disputes': 'Unpaid or deducted wages, overtime and minimum wage claims.',
  },

  'Constitutional Law': {
    'Writ Petitions': 'Challenging arbitrary state action before the High Court.',
    'Public Interest Litigation (PIL)': 'Petitions on behalf of a class that cannot approach the court itself.',
    'Fundamental Rights': 'Enforcing the rights guaranteed by Part III of the Constitution.',
    'Service Matters': 'Promotion, seniority, pension and discipline in government service.',
    'Election Disputes': 'Election petitions and challenges to the electoral process.',
    'Habeas Corpus': 'Producing a person held in unlawful custody before the court.',
    'Judicial Review': 'Testing the legality of a statute, rule or executive decision.',
  },

  'Consumer Law': {
    'Consumer Complaints': 'Filing before the District, State or National Commission.',
    'Product Liability': 'Harm caused by a defective or unsafe product.',
    'Medical Negligence': 'Compensation for treatment that fell below a reasonable standard.',
    'Insurance Claims': 'Claims rejected, delayed or settled short of what is due.',
    'E-commerce Disputes': 'Orders, refunds and platform liability in online purchases.',
    'Unfair Trade Practices': 'Misleading advertisements, hidden conditions and false claims.',
    'Deficiency in Service': 'Banking, telecom, travel and other services that fell short.',
    'Banking Disputes': 'Unauthorised debits, hidden charges and loan account grievances.',
  },

  'Intellectual Property': {
    'Trademark Registration': 'Searching, filing and prosecuting a brand name or logo.',
    Copyright: 'Protecting original writing, music, film, art and software.',
    Patents: 'Protecting an invention, from provisional filing through to grant.',
    'Design Registration': 'Protecting the shape, pattern or appearance of a product.',
    'IP Litigation': 'Suits and injunctions when your rights are being infringed.',
    'Licensing & Assignment': 'Permitting or transferring the use of IP, on written terms.',
    'Trade Secrets': 'Protecting confidential business information through contract.',
    'IP Infringement': 'Cease-and-desist action, takedowns and damages against copying.',
  },

  'Real Estate / RERA': {
    'RERA Complaints': 'Complaints against a promoter before the state RERA authority.',
    'Builder-Buyer Disputes': 'Disputes arising from the agreement you signed with the builder.',
    'Possession Delays': 'Interest for every month of delay, or refund with interest.',
    'Refund Claims': 'Withdrawing from a stalled project and recovering what you paid.',
    'Title Due Diligence': 'Verifying a project’s approvals and title before you book.',
    'Lease & Rent Agreements': 'Residential and commercial leases, drafted and registered.',
    Redevelopment: 'Society redevelopment agreements, consents and members’ rights.',
    'Society Matters': 'Formation, conveyance, and disputes with the managing committee.',
  },

  'Immigration Law': {
    'Visa Applications': 'Preparing and filing visa applications that hold up to scrutiny.',
    'Work Permits': 'Employer-sponsored permits and the right category to apply under.',
    Citizenship: 'Naturalisation, registration and renunciation of citizenship.',
    'PIO / OCI': 'Overseas Citizen of India cards, conversions and re-issue.',
    'Passport Matters': 'Issue, re-issue, surrender and police verification problems.',
    Deportation: 'Overstay, removal proceedings and FRRO matters.',
    'Student Visa': 'Study permits, financial documentation and the statement of purpose.',
    'Permanent Residency': 'Points-based and sponsored routes to settling abroad.',
  },
};

/** One-line description for a matter, or an empty string when none is written. */
export function getMatterDescription(serviceName, matterName) {
  return MATTER_DESCRIPTIONS[serviceName]?.[matterName] || '';
}
