/**
 * Seed the legal-services catalogue with a starter set.
 *
 *   node --env-file=.env scripts/seed-marketplace.mjs
 *
 * Inserts only what is missing, matched on slug. It never touches a service
 * that already exists, because the moment an admin edits a price or a
 * description here, re-running this would quietly undo their work — and the
 * one thing a seed script must never do is overwrite live content.
 *
 * The prices below are placeholders. They are meant to be edited from the
 * admin panel; nothing in the code depends on these particular numbers.
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error(
    'MONGODB_URI is not set. Run it as: node --env-file=.env scripts/seed-marketplace.mjs'
  );
  process.exit(1);
}

const SERVICES = [
  {
    slug: 'private-limited-company-registration',
    title: 'Private Limited Company Registration',
    category: 'Start a Business',
    summary: 'Incorporate your Pvt Ltd company with DIN, DSC and MOA/AOA.',
    description:
      'End-to-end incorporation of a Private Limited Company with the Ministry of Corporate Affairs. Includes name approval, Director Identification Numbers, Digital Signature Certificates for two directors, drafting of the Memorandum and Articles of Association, and the Certificate of Incorporation along with PAN and TAN.',
    price: 6999,
    mrp: 11999,
    turnaround: '10–15 working days',
    sortOrder: 1,
    includes: [
      'Company name approval (RUN)',
      '2 Digital Signature Certificates',
      '2 Director Identification Numbers',
      'MOA and AOA drafting',
      'Certificate of Incorporation',
      'Company PAN and TAN',
    ],
    documentsRequired: [
      'PAN card of all directors',
      'Aadhaar card of all directors',
      'Passport-size photographs',
      'Latest bank statement or utility bill of each director',
      'Proof of registered office address',
      'No-objection certificate from the property owner',
    ],
    howItWorks: [
      { title: 'Share your details', description: 'Fill in the company name options and director details.' },
      { title: 'Upload documents', description: 'Our team checks everything and flags anything missing.' },
      { title: 'Filing with the MCA', description: 'We prepare and file the incorporation forms on your behalf.' },
      { title: 'Get your certificate', description: 'The Certificate of Incorporation, PAN and TAN reach your inbox.' },
    ],
  },
  {
    slug: 'llp-registration',
    title: 'LLP Registration',
    category: 'Start a Business',
    summary: 'Register a Limited Liability Partnership, agreement included.',
    description:
      'Registration of a Limited Liability Partnership with the Ministry of Corporate Affairs, including name reservation, Designated Partner Identification Numbers, Digital Signature Certificates, and drafting and filing of the LLP agreement.',
    price: 5999,
    mrp: 9999,
    turnaround: '12–18 working days',
    sortOrder: 2,
    includes: [
      'LLP name reservation',
      '2 Digital Signature Certificates',
      '2 DPINs',
      'LLP agreement drafting and filing',
      'Certificate of Incorporation',
      'LLP PAN and TAN',
    ],
    documentsRequired: [
      'PAN card of all partners',
      'Aadhaar card of all partners',
      'Passport-size photographs',
      'Proof of registered office address',
      'No-objection certificate from the property owner',
    ],
    howItWorks: [
      { title: 'Share your details', description: 'Partner details and your preferred LLP names.' },
      { title: 'Upload documents', description: 'We verify each document before anything is filed.' },
      { title: 'Filing and agreement', description: 'Incorporation forms and the LLP agreement go to the MCA.' },
      { title: 'Get your certificate', description: 'Incorporation certificate, PAN and TAN delivered.' },
    ],
  },
  {
    slug: 'gst-registration',
    title: 'GST Registration',
    category: 'Start a Business',
    summary: 'Get your GSTIN with expert help on the right category.',
    description:
      'Application for Goods and Services Tax registration, from choosing the correct registration type through to the GSTIN certificate. Includes a review of your turnover and business activity so the registration matches how you actually trade.',
    price: 999,
    mrp: 2499,
    turnaround: '5–7 working days',
    sortOrder: 3,
    includes: [
      'Eligibility and category review',
      'Preparation and filing of the application',
      'Handling departmental queries',
      'GSTIN certificate',
    ],
    documentsRequired: [
      'PAN card of the business or proprietor',
      'Aadhaar card of the proprietor or partners',
      'Proof of business address',
      'Bank account details or a cancelled cheque',
      'Passport-size photograph',
    ],
    howItWorks: [
      { title: 'Tell us about the business', description: 'Turnover, activity and where you operate from.' },
      { title: 'Upload documents', description: 'We check each one against the GST requirements.' },
      { title: 'Application filed', description: 'We file and respond to any queries from the department.' },
      { title: 'GSTIN issued', description: 'Your certificate is sent to you as soon as it is granted.' },
    ],
  },
  {
    slug: 'trademark-registration',
    title: 'Trademark Registration',
    category: 'Trademark & IP',
    summary: 'Search, class selection and filing for your brand name or logo.',
    description:
      'Protection for your brand name, logo or tagline. Includes a public search to see whether the mark is available, advice on the right class or classes, and filing of the application with the Trade Marks Registry.',
    price: 3999,
    mrp: 7999,
    turnaround: '3–5 working days to file',
    sortOrder: 4,
    includes: [
      'Trademark availability search',
      'Class selection advice',
      'Preparation and filing of TM-A',
      'Filing receipt and application number',
    ],
    documentsRequired: [
      'Logo file, if you are registering a logo',
      'PAN and Aadhaar of the applicant',
      'Business registration certificate, if a company or LLP',
      'Udyam certificate, if you want the small-entity fee',
    ],
    howItWorks: [
      { title: 'Search', description: 'We check the registry for conflicting marks before you spend anything more.' },
      { title: 'Pick the class', description: 'We advise on the classes that actually cover your goods or services.' },
      { title: 'Filing', description: 'The application goes to the Trade Marks Registry.' },
      { title: 'Track', description: 'You get the application number and can use the ™ symbol straight away.' },
    ],
  },
  {
    slug: 'rent-agreement-drafting',
    title: 'Rent Agreement Drafting',
    category: 'Documentation',
    summary: 'A lawyer-drafted rent agreement, tailored to your terms.',
    description:
      'A rent or lease agreement drafted by a lawyer around your actual terms — rent, deposit, lock-in, notice period, maintenance and who repairs what. Two rounds of changes are included.',
    price: 999,
    mrp: 1999,
    turnaround: '2–3 working days',
    sortOrder: 5,
    includes: [
      'Lawyer-drafted agreement',
      'Clauses tailored to your terms',
      'Two rounds of revisions',
      'Guidance on stamping and registration',
    ],
    documentsRequired: [
      'ID proof of the landlord and the tenant',
      'Property address and details',
      'Agreed rent, deposit and duration',
    ],
    howItWorks: [
      { title: 'Share the terms', description: 'Rent, deposit, duration and anything specific to your arrangement.' },
      { title: 'Draft prepared', description: 'A lawyer drafts the agreement and sends it for review.' },
      { title: 'Revisions', description: 'Two rounds of changes are included.' },
      { title: 'Final copy', description: 'You get the final draft plus guidance on stamp duty.' },
    ],
  },
  {
    slug: 'legal-notice',
    title: 'Legal Notice Drafting & Dispatch',
    category: 'Documentation',
    summary: 'A lawyer drafts and sends a legal notice on your behalf.',
    description:
      'A legal notice drafted by an advocate, sent on their letterhead by registered post, with the dispatch proof handed back to you. Used for recovery of money, property disputes, employment matters and consumer complaints.',
    price: 1499,
    mrp: 2999,
    turnaround: '3–4 working days',
    sortOrder: 6,
    includes: [
      'Consultation on the facts',
      'Notice drafted on advocate letterhead',
      'Dispatch by registered post',
      'Proof of dispatch shared with you',
    ],
    documentsRequired: [
      'Details of the other party, with their address',
      'Supporting documents — agreements, invoices, messages',
      'Your ID proof',
    ],
    howItWorks: [
      { title: 'Tell us what happened', description: 'A short call to get the facts and what you want to achieve.' },
      { title: 'Notice drafted', description: 'An advocate drafts the notice and shares it for your approval.' },
      { title: 'Dispatch', description: 'The notice is sent by registered post on the advocate’s letterhead.' },
      { title: 'Proof', description: 'You receive the dispatch receipt and a copy of the notice.' },
    ],
  },
  {
    slug: 'will-drafting',
    title: 'Will Drafting',
    category: 'Documentation',
    summary: 'A clear, valid Will drafted by a lawyer.',
    description:
      'A Will drafted by a lawyer covering your assets, beneficiaries and executor, written to hold up when it matters. Includes advice on witnesses, safekeeping and whether registration is worth it in your case.',
    price: 2999,
    mrp: 5999,
    turnaround: '4–6 working days',
    sortOrder: 7,
    includes: [
      'Consultation with a lawyer',
      'Full Will drafted to your instructions',
      'Two rounds of revisions',
      'Guidance on execution and registration',
    ],
    documentsRequired: [
      'Your ID and address proof',
      'List of assets with ownership documents',
      'Details of beneficiaries',
      'Details of the executor you have in mind',
    ],
    howItWorks: [
      { title: 'Consultation', description: 'A lawyer takes you through your assets and intentions.' },
      { title: 'Draft', description: 'The Will is drafted and sent to you to read.' },
      { title: 'Revisions', description: 'Two rounds of changes are included.' },
      { title: 'Execution guidance', description: 'How to sign it, who should witness, and where to keep it.' },
    ],
  },
  {
    slug: 'affidavit-drafting',
    title: 'Affidavit Drafting',
    category: 'Documentation',
    summary: 'Any affidavit, drafted correctly the first time.',
    description:
      'Drafting of an affidavit for any purpose — name change, address proof, income, gap in education, loss of documents — in the form the authority asking for it will accept.',
    price: 499,
    mrp: 999,
    turnaround: '1–2 working days',
    sortOrder: 8,
    includes: [
      'Affidavit drafted to purpose',
      'One round of revisions',
      'Guidance on the stamp paper value',
      'Notarisation guidance',
    ],
    documentsRequired: ['Your ID proof', 'Details of what the affidavit is for'],
    howItWorks: [
      { title: 'Tell us the purpose', description: 'Who is asking for it, and what it needs to say.' },
      { title: 'Draft prepared', description: 'Drafted in the accepted form for that purpose.' },
      { title: 'Review', description: 'One round of changes is included.' },
      { title: 'Print and notarise', description: 'We tell you the stamp paper value and the next step.' },
    ],
  },
  {
    slug: 'property-document-verification',
    title: 'Property Document Verification',
    category: 'Property',
    summary: 'A lawyer checks the title before you pay for a property.',
    description:
      'A title check on the property you are about to buy: chain of ownership, encumbrances, approvals and litigation history, with a written report on what the papers actually show and what is missing.',
    price: 4999,
    mrp: 9999,
    turnaround: '5–8 working days',
    sortOrder: 9,
    includes: [
      'Chain of title examination',
      'Encumbrance certificate review',
      'Check of approvals and permissions',
      'Written verification report',
      'Call with the reviewing lawyer',
    ],
    documentsRequired: [
      'Sale deed or title deed',
      'Encumbrance certificate',
      'Property tax receipts',
      'Approved building plan, where applicable',
      'Mutation and khata documents',
    ],
    howItWorks: [
      { title: 'Send the papers', description: 'Upload everything you have; we tell you what else to ask for.' },
      { title: 'Examination', description: 'A property lawyer works through the chain of title.' },
      { title: 'Report', description: 'A written report setting out the risks in plain language.' },
      { title: 'Discussion', description: 'A call to take you through what it means for the purchase.' },
    ],
  },
  {
    slug: 'sale-deed-drafting',
    title: 'Sale Deed Drafting',
    category: 'Property',
    summary: 'A sale deed drafted and checked before registration.',
    description:
      'Drafting of a sale deed for immovable property, with the stamp duty position for your state and guidance on the registration appointment.',
    price: 3999,
    mrp: 6999,
    turnaround: '4–6 working days',
    sortOrder: 10,
    includes: [
      'Sale deed drafted by a lawyer',
      'Two rounds of revisions',
      'Stamp duty and registration guidance',
      'Review of the buyer and seller details',
    ],
    documentsRequired: [
      'Existing title documents',
      'ID and address proof of both parties',
      'Property tax receipts',
      'Agreed sale consideration and payment terms',
    ],
    howItWorks: [
      { title: 'Share the details', description: 'Parties, property and the agreed terms.' },
      { title: 'Draft', description: 'The deed is drafted and sent to both sides to read.' },
      { title: 'Revisions', description: 'Two rounds of changes are included.' },
      { title: 'Registration guidance', description: 'What to pay, where to go, and what to carry.' },
    ],
  },
  {
    slug: 'mutual-consent-divorce',
    title: 'Mutual Consent Divorce',
    category: 'Family',
    summary: 'End-to-end filing for a divorce by mutual consent.',
    description:
      'Handling of a mutual consent divorce from the joint petition through to the decree — drafting, filing, and representation at both motions. Court fees are separate.',
    price: 14999,
    mrp: 24999,
    turnaround: 'Depends on the court, typically 6–8 months',
    sortOrder: 11,
    includes: [
      'Consultation with a family lawyer',
      'Drafting of the joint petition and settlement terms',
      'Filing at the appropriate family court',
      'Representation at the first and second motion',
    ],
    documentsRequired: [
      'Marriage certificate or proof of marriage',
      'ID and address proof of both spouses',
      'Marriage photographs',
      'Details of any agreed settlement',
      'Proof of separate residence, where applicable',
    ],
    howItWorks: [
      { title: 'Consultation', description: 'A family lawyer takes both parties through the process.' },
      { title: 'Petition drafted', description: 'The joint petition and settlement terms are prepared.' },
      { title: 'First motion', description: 'The petition is filed and both parties record their statements.' },
      { title: 'Second motion', description: 'After the cooling-off period, the decree is granted.' },
    ],
  },
  {
    slug: 'cheque-bounce-notice',
    title: 'Cheque Bounce Notice',
    category: 'Recovery',
    summary: 'The statutory notice under Section 138, sent within the deadline.',
    description:
      'The demand notice a payee must send after a cheque is dishonoured, drafted and dispatched by an advocate. The law gives you 30 days from the bank memo, so this is filed on a clock.',
    price: 1999,
    mrp: 3999,
    turnaround: '2–3 working days',
    sortOrder: 12,
    includes: [
      'Review of the cheque and bank memo',
      'Statutory notice drafted by an advocate',
      'Dispatch by registered post',
      'Proof of dispatch shared with you',
      'Advice on what happens if there is no payment',
    ],
    documentsRequired: [
      'The dishonoured cheque',
      'The bank return memo',
      'Details of the drawer, with their address',
      'Any agreement or invoice behind the payment',
    ],
    howItWorks: [
      { title: 'Send the cheque and memo', description: 'We check you are still inside the 30-day window.' },
      { title: 'Notice drafted', description: 'An advocate drafts the notice under Section 138.' },
      { title: 'Dispatch', description: 'Sent by registered post, with the receipt shared with you.' },
      { title: 'Next steps', description: 'If there is no payment in 15 days, we advise on filing a complaint.' },
    ],
  },
  {
    slug: 'consumer-complaint-filing',
    title: 'Consumer Complaint Filing',
    category: 'Consumer',
    summary: 'File against a seller or service provider that let you down.',
    description:
      'Drafting and filing of a complaint before the appropriate consumer commission, including the notice that comes first and the evidence affidavit that goes with the complaint.',
    price: 2999,
    mrp: 5999,
    turnaround: '5–7 working days to file',
    sortOrder: 13,
    includes: [
      'Consultation on the merits',
      'Legal notice to the opposite party',
      'Drafting of the complaint and affidavit',
      'Filing before the right commission',
    ],
    documentsRequired: [
      'Invoice or proof of purchase',
      'Warranty or service agreement',
      'Correspondence with the seller',
      'Photographs or reports evidencing the defect',
      'Your ID proof',
    ],
    howItWorks: [
      { title: 'Tell us what happened', description: 'A lawyer assesses whether the complaint is worth filing.' },
      { title: 'Notice', description: 'A legal notice goes to the seller or service provider first.' },
      { title: 'Complaint drafted', description: 'The complaint and evidence affidavit are prepared.' },
      { title: 'Filing', description: 'Filed before the district, state or national commission as applicable.' },
    ],
  },
  {
    slug: 'name-change-gazette',
    title: 'Name Change (Gazette Notification)',
    category: 'Personal',
    summary: 'Affidavit, newspaper publication and Gazette notification.',
    description:
      'The full name-change process: the affidavit, publication in two newspapers, and the application for notification in the Official Gazette.',
    price: 2499,
    mrp: 4999,
    turnaround: '30–60 days, depending on the Gazette',
    sortOrder: 14,
    includes: [
      'Name change affidavit drafted',
      'Newspaper publication in two dailies',
      'Gazette application prepared and filed',
      'Copy of the Gazette notification',
    ],
    documentsRequired: [
      'Aadhaar card',
      'PAN card',
      'Passport-size photographs',
      'Proof of the reason for the change, where applicable',
      'Marriage certificate, if the change follows a marriage',
    ],
    howItWorks: [
      { title: 'Affidavit', description: 'The name change affidavit is drafted and notarised.' },
      { title: 'Publication', description: 'The change is published in two newspapers.' },
      { title: 'Gazette application', description: 'The application goes to the Department of Publication.' },
      { title: 'Notification', description: 'The Gazette copy is sent to you once published.' },
    ],
  },
];

const StepSchema = new mongoose.Schema(
  { title: String, description: String },
  { _id: false }
);

const LegalServiceSchema = new mongoose.Schema(
  {
    title: String,
    slug: { type: String, unique: true },
    category: String,
    summary: String,
    description: String,
    banner: { type: String, default: '' },
    price: Number,
    mrp: Number,
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    purchased: { type: Number, default: 0 },
    howItWorks: { type: [StepSchema], default: [] },
    includes: { type: [String], default: [] },
    documentsRequired: { type: [String], default: [] },
    turnaround: String,
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const LegalService =
  mongoose.models.LegalService || mongoose.model('LegalService', LegalServiceSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);

  let added = 0;
  let skipped = 0;

  for (const service of SERVICES) {
    if (await LegalService.exists({ slug: service.slug })) {
      skipped += 1;
      continue;
    }
    await LegalService.create({ ...service, active: true });
    added += 1;
    console.log(`  + ${service.title}`);
  }

  console.log(`\n${added} added, ${skipped} already present.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
