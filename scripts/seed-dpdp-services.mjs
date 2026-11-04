/**
 * Seed the data-protection services — compliance under the Digital Personal
 * Data Protection Act, 2023 (DPDP Act) and the DPDP Rules, 2025.
 *
 *   node --env-file=.env scripts/seed-dpdp-services.mjs
 *
 * Insert-only, matched on slug, exactly like seed-litigation-services.mjs: a
 * service that already exists is never touched, so an admin's edits survive a
 * re-run.
 *
 * Prices are the lawyer's professional fee for the scope listed, for a small
 * or mid-sized business, pitched at what Indian law firms and online legal
 * platforms charged in 2025–26 for the same work. No MRP — services are sold
 * at their price, with no offers. GST is added at checkout.
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error(
    'MONGODB_URI is not set. Run it as: node --env-file=.env scripts/seed-dpdp-services.mjs'
  );
  process.exit(1);
}

const CATEGORY = 'Data Privacy (DPDP)';
const SCOPE =
  'Scope is for one business entity with one website or app; group companies and larger systems are quoted separately.';

const SERVICES = [
  {
    slug: 'dpdp-act-compliance-assessment',
    title: 'DPDP Act Compliance Assessment',
    category: CATEGORY,
    summary: 'A gap review of how your business handles personal data, against the DPDP Act, 2023 and Rules, 2025.',
    description:
      `Any business that collects personal data of people in India — customers, users or employees — is a Data Fiduciary under the Digital Personal Data Protection Act, 2023. An advocate reviews what personal data you collect, why, where it is stored, who it is shared with and how long it is kept, and compares that with the Act and the DPDP Rules, 2025: notice and consent, purpose limitation, security safeguards, breach intimation, retention and erasure, children's data and the rights of Data Principals. You receive a written gap report with a prioritised action list. ${SCOPE}`,
    price: 24999,
    mrp: 0,
    turnaround: 'Report within 10–15 working days of the questionnaire',
    includes: [
      'Data-mapping questionnaire and one review call',
      'Review of your website/app forms, privacy policy and vendor list',
      'Written gap report against the DPDP Act and Rules',
      'Prioritised action list with responsibilities',
      'One follow-up call to walk through the report',
    ],
    documentsRequired: [
      'Company incorporation details and GST number',
      'Current privacy policy, terms and consent forms (if any)',
      'List of tools and vendors that handle personal data (CRM, payments, cloud, SMS)',
      'Completed data-mapping questionnaire (we send it)',
    ],
    howItWorks: [
      { title: 'Questionnaire', description: 'You fill in what data you collect, where it goes and why.' },
      { title: 'Review call', description: 'The advocate walks through your forms, systems and vendors with you.' },
      { title: 'Gap report', description: 'A written report of where you fall short of the Act and what to fix first.' },
      { title: 'Walk-through', description: 'A follow-up call to explain the report and the next steps.' },
    ],
  },
  {
    slug: 'dpdp-privacy-policy-consent-notice',
    title: 'DPDP Privacy Policy & Consent Notice Drafting',
    category: CATEGORY,
    summary: 'A privacy notice and consent wording for your website or app, written for the DPDP Act.',
    description:
      `Section 5 of the DPDP Act requires a clear notice before or at the time you ask for consent: what personal data you collect, for what purpose, how a person can withdraw consent, exercise their rights and complain to the Data Protection Board of India. An advocate drafts a privacy policy and consent notice that fits how your business actually uses data, along with the consent checkbox wording and a withdrawal-of-consent process. ${SCOPE}`,
    price: 7999,
    mrp: 0,
    turnaround: 'First draft within 4–6 working days',
    includes: [
      'Privacy policy written for the DPDP Act, 2023 and Rules, 2025',
      'Consent notice and checkbox wording for sign-up and forms',
      'Withdrawal-of-consent and grievance-redressal process',
      'Cookie notice wording',
      'Two rounds of revisions',
    ],
    documentsRequired: [
      'Business name, registered address and grievance contact',
      'Website or app link and sign-up / enquiry forms',
      'List of personal data you collect and why',
      'Vendors you share data with (payments, analytics, SMS, cloud)',
    ],
    howItWorks: [
      { title: 'Share details', description: 'Tell us what data you collect and how you use it.' },
      { title: 'Drafting', description: 'The advocate drafts the policy, consent notice and processes.' },
      { title: 'Revisions', description: 'Two rounds of changes until it matches your business.' },
      { title: 'Final copy', description: 'Ready-to-publish text for your website and app.' },
    ],
  },
  {
    slug: 'data-processing-agreement-drafting',
    title: 'Data Processing Agreement (DPA) Drafting',
    category: CATEGORY,
    summary: 'A contract with a vendor that handles personal data for you, as the DPDP Act requires.',
    description:
      `Under Section 8 of the DPDP Act, a Data Fiduciary may give personal data to a Data Processor only under a valid contract, and stays responsible for what the processor does with it. An advocate drafts or reviews a Data Processing Agreement covering purpose, security safeguards, confidentiality, breach intimation timelines, sub-processors, cross-border transfer, audit rights and deletion of data when the contract ends. Covers one agreement with one vendor or client.`,
    price: 9999,
    mrp: 0,
    turnaround: 'First draft within 4–6 working days',
    includes: [
      'Data Processing Agreement drafted or reviewed for one counterparty',
      'Security, confidentiality and breach-intimation clauses',
      'Sub-processor, cross-border transfer and audit clauses',
      'Return or deletion of data on termination',
      'Two rounds of revisions',
    ],
    documentsRequired: [
      'Main service agreement with the vendor or client (if any)',
      'Description of the data shared and the services provided',
      'Both parties’ names and registered addresses',
    ],
    howItWorks: [
      { title: 'Share the deal', description: 'Send the main contract and what data changes hands.' },
      { title: 'Drafting', description: 'The advocate drafts or marks up the DPA.' },
      { title: 'Revisions', description: 'Two rounds of changes, including the other side’s comments.' },
      { title: 'Final copy', description: 'A signature-ready agreement.' },
    ],
  },
  {
    slug: 'personal-data-breach-response',
    title: 'Personal Data Breach Response & Board Intimation',
    category: CATEGORY,
    summary: 'Legal help after a data breach: intimation to the Data Protection Board and to affected people.',
    description:
      `When personal data is leaked, stolen, lost or wrongly accessed, the DPDP Rules, 2025 require the Data Fiduciary to inform each affected person and the Data Protection Board of India without delay, and to file a detailed report with the Board within 72 hours of becoming aware of it. An advocate helps you record the facts, drafts the intimation to the Board and the notice to affected Data Principals, and advises on CERT-In reporting where it applies. Technical forensics are not included.`,
    price: 19999,
    mrp: 0,
    turnaround: 'Drafts within 24 hours of the facts',
    includes: [
      'Urgent consultation to record what happened',
      'Intimation and detailed report to the Data Protection Board of India',
      'Notice to affected Data Principals',
      'Advice on CERT-In reporting where applicable',
      'Checklist of steps to contain and document the breach',
    ],
    documentsRequired: [
      'What happened, when it was discovered and which systems were involved',
      'Categories and approximate number of people affected',
      'Steps already taken to contain the breach',
      'Company details and the person responsible for data protection',
    ],
    howItWorks: [
      { title: 'Call us', description: 'An advocate takes down the facts on an urgent call.' },
      { title: 'Drafting', description: 'Board intimation and the notice to affected people are drafted.' },
      { title: 'Filing', description: 'You review and submit within the 72-hour window.' },
      { title: 'Follow-up', description: 'Advice on documentation and any questions from the Board.' },
    ],
  },
];

const StepSchema = new mongoose.Schema({ title: String, description: String }, { _id: false });
const LegalServiceSchema = new mongoose.Schema(
  {
    title: String,
    slug: { type: String, unique: true },
    category: String,
    summary: String,
    description: String,
    banner: String,
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
    await LegalService.create({ ...service, active: true, sortOrder: 0 });
    added += 1;
    console.log(`  + ${service.title} — ₹${service.price}`);
  }

  console.log(`\n${added} added, ${skipped} already present.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
