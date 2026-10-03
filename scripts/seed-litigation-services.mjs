/**
 * Seed the court-work services the catalogue was missing — cheque bounce
 * cases, divorce, custody, bail and the rest of what people actually come to
 * a lawyer for.
 *
 *   node --env-file=.env scripts/seed-litigation-services.mjs
 *
 * Insert-only, matched on slug, exactly like seed-marketplace.mjs: a service
 * that already exists is never touched, so an admin's edits survive a re-run.
 *
 * Prices are the lawyer's professional fee for the scope listed, pitched at
 * the middle of what Indian online legal platforms and city practitioners
 * charged in 2025–26 for the same work. Court fees, stamp duty and government
 * fees vary by state and by the amount involved, so they are always extra, at
 * actuals — every description says so. GST is added at checkout.
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error(
    'MONGODB_URI is not set. Run it as: node --env-file=.env scripts/seed-litigation-services.mjs'
  );
  process.exit(1);
}

const EXTRA = 'Court fee, stamp duty and government fees are extra, at actuals.';

const SERVICES = [
  // ── Recovery ────────────────────────────────────────────────────────────
  {
    slug: 'cheque-bounce-case-filing',
    title: 'Cheque Bounce Case Filing (Section 138)',
    category: 'Recovery',
    summary: 'Criminal complaint for a dishonoured cheque, drafted and filed in court.',
    description:
      `When the 15 days after your legal notice pass without payment, the next step is a complaint under Section 138 of the Negotiable Instruments Act before the magistrate. An advocate drafts the complaint and your evidence affidavit, files it within the one-month limit, and appears at the first hearing to get summons issued. Later hearings are billed separately. ${EXTRA}`,
    price: 9999,
    mrp: 17999,
    turnaround: 'Filed within 5–7 working days of documents',
    includes: [
      'Review of cheque, return memo, notice and postal proof',
      'Complaint under Section 138 NI Act',
      'Evidence affidavit and list of documents',
      'Filing before the competent magistrate',
      'Appearance at the first hearing for summons',
    ],
    documentsRequired: [
      'Original dishonoured cheque and bank return memo',
      'Copy of the legal notice sent, with postal receipt and tracking',
      'Any reply received from the drawer',
      'Agreement, invoice or ledger showing the debt',
      'Your ID and address proof (or board resolution for a company)',
    ],
    howItWorks: [
      { title: 'Share the papers', description: 'We confirm you are inside the one-month window to file.' },
      { title: 'Complaint drafted', description: 'The complaint and evidence affidavit are prepared for your signature.' },
      { title: 'Filing', description: 'Filed before the magistrate where your bank branch sits.' },
      { title: 'Summons', description: 'Your advocate appears and seeks summons against the drawer.' },
    ],
  },
  {
    slug: 'reply-to-cheque-bounce-notice',
    title: 'Reply to Cheque Bounce Notice',
    category: 'Recovery',
    summary: 'A considered reply to a Section 138 notice, sent before the 15 days run out.',
    description:
      'Received a cheque bounce notice? What you say in reply can be used in the case that may follow. An advocate reviews the facts — security cheque, part payment, a disputed debt — and drafts a reply that protects your defence.',
    price: 2499,
    mrp: 4999,
    turnaround: '2–3 working days',
    includes: [
      'Review of the notice and your side of the facts',
      'Reply drafted by an advocate',
      'Dispatch by registered post / speed post',
      'Advice on settlement and on the case that may follow',
    ],
    documentsRequired: [
      'The notice you received',
      'Copy of the cheque, if you have it',
      'Any agreement, receipts or messages about the payment',
    ],
    howItWorks: [
      { title: 'Share the notice', description: 'We note the date it reached you — the clock runs from there.' },
      { title: 'Call with a lawyer', description: 'Walk the advocate through what happened.' },
      { title: 'Reply drafted', description: 'You approve the draft before it goes out.' },
      { title: 'Dispatched', description: 'Sent with proof of dispatch shared with you.' },
    ],
  },
  {
    slug: 'money-recovery-suit',
    title: 'Money Recovery Suit (Order 37 Summary Suit)',
    category: 'Recovery',
    summary: 'Civil suit to recover an unpaid loan, invoice or dues.',
    description:
      `For money owed on a written contract, invoice, bill or promissory note, a summary suit under Order XXXVII of the Code of Civil Procedure is the fastest civil route — the defendant must seek leave to defend. Includes drafting, filing and appearance until the summons stage. ${EXTRA}`,
    price: 19999,
    mrp: 34999,
    turnaround: 'Filed within 7–10 working days of documents',
    includes: [
      'Assessment of the claim and limitation',
      'Plaint under Order XXXVII CPC',
      'Supporting affidavit and documents',
      'Filing and appearance until summons',
    ],
    documentsRequired: [
      'Agreement, invoices, bills or promissory note',
      'Ledger or statement of account',
      'Legal notice sent, if any, with postal proof',
      'Correspondence acknowledging the debt',
    ],
    howItWorks: [
      { title: 'Claim review', description: 'A lawyer checks the documents and the limitation period.' },
      { title: 'Plaint drafted', description: 'Prepared and shared with you for approval.' },
      { title: 'Filed', description: 'Filed in the court with jurisdiction, court fee paid.' },
      { title: 'Summons', description: 'Your advocate appears until summons is served.' },
    ],
  },

  // ── Family ──────────────────────────────────────────────────────────────
  {
    slug: 'contested-divorce-petition',
    title: 'Contested Divorce Petition',
    category: 'Family',
    summary: 'Divorce petition on grounds such as cruelty or desertion, drafted and filed.',
    description:
      `When your spouse does not agree to a divorce, the petition has to be filed on a ground the law recognises — cruelty, desertion, adultery and others under the Hindu Marriage Act, Special Marriage Act or your personal law. A family lawyer drafts the petition, files it in the family court and appears at the first hearing. Contested cases run over many hearings; appearances after the first are billed per hearing. ${EXTRA}`,
    price: 24999,
    mrp: 39999,
    turnaround: 'Petition filed within 7–10 working days; case runs 1–3 years',
    includes: [
      'Detailed consultation with a family lawyer',
      'Divorce petition and supporting affidavit',
      'Interim applications (maintenance, custody) if needed',
      'Filing at the family court',
      'Appearance at the first hearing',
    ],
    documentsRequired: [
      'Marriage certificate or wedding photographs/invitation',
      'ID and address proof',
      'Evidence of the ground relied on (messages, complaints, medical records)',
      'Details of children, income and assets',
    ],
    howItWorks: [
      { title: 'Consultation', description: 'The lawyer advises on the grounds and the evidence.' },
      { title: 'Petition drafted', description: 'Shared with you for corrections before filing.' },
      { title: 'Filed', description: 'Filed in the family court with jurisdiction.' },
      { title: 'Hearings', description: 'Your lawyer represents you; you are updated after each date.' },
    ],
  },
  {
    slug: 'child-custody-petition',
    title: 'Child Custody Petition',
    category: 'Family',
    summary: 'Custody or visitation petition under the Guardians and Wards Act.',
    description:
      `Custody, joint custody or visitation rights for a child, sought on its own or alongside a divorce. Courts decide on the welfare of the child, so the petition is built around schooling, care, income and stability. Includes drafting, filing and the first hearing; later hearings are billed separately. ${EXTRA}`,
    price: 19999,
    mrp: 34999,
    turnaround: 'Petition filed within 7–10 working days',
    includes: [
      'Consultation on custody, guardianship and visitation',
      'Petition under the Guardians and Wards Act / personal law',
      'Application for interim custody or visitation',
      'Filing in the family court',
      'Appearance at the first hearing',
    ],
    documentsRequired: [
      "Child's birth certificate",
      "Child's school records",
      'Marriage certificate and any divorce papers',
      'Your income and residence proof',
      'Anything bearing on the child’s welfare',
    ],
    howItWorks: [
      { title: 'Consultation', description: 'The lawyer advises what the court will weigh.' },
      { title: 'Petition drafted', description: 'Along with an interim custody application where needed.' },
      { title: 'Filed', description: 'Filed in the family court where the child lives.' },
      { title: 'Hearings', description: 'Representation, counselling and mediation dates handled.' },
    ],
  },
  {
    slug: 'maintenance-petition',
    title: 'Maintenance Petition (Wife / Children / Parents)',
    category: 'Family',
    summary: 'Claim monthly maintenance under Section 144 BNSS or the Hindu Marriage Act.',
    description:
      `A petition for monthly maintenance for a wife, children or parents who cannot maintain themselves — under Section 144 of the BNSS (formerly Section 125 CrPC), Section 24 of the Hindu Marriage Act during a divorce, or the Domestic Violence Act. Includes drafting, an interim maintenance application, filing and the first hearing. ${EXTRA}`,
    price: 12999,
    mrp: 21999,
    turnaround: 'Filed within 5–7 working days',
    includes: [
      'Consultation on the right provision to file under',
      'Maintenance petition and affidavit of assets and liabilities',
      'Interim maintenance application',
      'Filing and first hearing',
    ],
    documentsRequired: [
      'Marriage certificate / proof of relationship',
      'Your income proof, or proof of having none',
      "The other side's employment or income details, if known",
      "Children's school fee and expense records",
    ],
    howItWorks: [
      { title: 'Consultation', description: 'Which law to use and what amount is realistic.' },
      { title: 'Drafting', description: 'Petition and the asset-liability affidavit courts now require.' },
      { title: 'Filing', description: 'Filed with an interim maintenance application.' },
      { title: 'Hearings', description: 'Your lawyer presses for interim maintenance early.' },
    ],
  },
  {
    slug: 'domestic-violence-complaint',
    title: 'Domestic Violence Case',
    category: 'Family',
    summary: 'Application under the Protection of Women from Domestic Violence Act.',
    description:
      `Protection orders, residence rights, monetary relief and custody for a woman facing physical, emotional, verbal or economic abuse at home. A lawyer drafts the application under the DV Act, coordinates with the Protection Officer, files before the magistrate and appears at the first hearing. ${EXTRA}`,
    price: 14999,
    mrp: 24999,
    turnaround: 'Filed within 3–5 working days; urgent cases sooner',
    includes: [
      'Confidential consultation',
      'Application under Section 12 of the DV Act',
      'Application for interim protection / residence orders',
      'Coordination with the Protection Officer',
      'Filing and first hearing',
    ],
    documentsRequired: [
      'Marriage proof',
      'Any medical records, photographs or police complaints',
      'Messages, recordings or witnesses to the abuse',
      'Details of shared household and income',
    ],
    howItWorks: [
      { title: 'Talk in confidence', description: 'Tell the lawyer what happened; safety comes first.' },
      { title: 'Application drafted', description: 'With interim relief sought for immediate protection.' },
      { title: 'Filed', description: 'Filed before the magistrate, through the Protection Officer where needed.' },
      { title: 'Orders', description: 'Your lawyer seeks protection and residence orders.' },
    ],
  },
  {
    slug: 'restitution-of-conjugal-rights',
    title: 'Restitution of Conjugal Rights Petition',
    category: 'Family',
    summary: 'Petition asking the court to direct a spouse who left to return.',
    description:
      `When a spouse has withdrawn from the marriage without reasonable cause, a petition under Section 9 of the Hindu Marriage Act (or Section 22 of the Special Marriage Act) asks the court to direct them to resume cohabitation. Includes drafting, filing and the first hearing. ${EXTRA}`,
    price: 12999,
    mrp: 19999,
    turnaround: 'Filed within 5–7 working days',
    includes: [
      'Consultation with a family lawyer',
      'Petition under Section 9 HMA / Section 22 SMA',
      'Filing in the family court',
      'Appearance at the first hearing',
    ],
    documentsRequired: [
      'Marriage certificate or proof of marriage',
      'ID and address proof',
      'Date and circumstances of the spouse leaving',
      'Any messages or notices exchanged since',
    ],
    howItWorks: [
      { title: 'Consultation', description: 'Whether this petition suits your situation.' },
      { title: 'Drafting', description: 'Petition prepared and approved by you.' },
      { title: 'Filing', description: 'Filed in the family court.' },
      { title: 'Hearings', description: 'Representation and mediation handled.' },
    ],
  },
  {
    slug: 'court-marriage',
    title: 'Court Marriage (Special Marriage Act)',
    category: 'Family',
    summary: 'Notice, objections period and registration of a court marriage.',
    description:
      `Marriage before the Marriage Officer under the Special Marriage Act — for any two adults, including inter-faith and inter-caste couples. Covers the notice of intended marriage, document preparation, guidance through the 30-day notice period and the marriage on the appointed day with three witnesses. ${EXTRA}`,
    price: 7999,
    mrp: 12999,
    turnaround: 'About 30–35 days (statutory notice period)',
    includes: [
      'Eligibility check and document review',
      'Notice of intended marriage and affidavits',
      'Filing with the Marriage Officer',
      'Assistance on the day of marriage and registration',
      'Marriage certificate',
    ],
    documentsRequired: [
      'Age proof of both (birth certificate / 10th marksheet / passport)',
      'Address proof of both',
      'Passport-size photographs',
      'Divorce decree or death certificate, if previously married',
      'ID proof of three witnesses',
    ],
    howItWorks: [
      { title: 'Documents', description: 'We check both of you are eligible and the papers are complete.' },
      { title: 'Notice filed', description: 'Notice of intended marriage is filed with the Marriage Officer.' },
      { title: '30-day period', description: 'The notice is displayed; we handle any objections.' },
      { title: 'Marriage', description: 'Solemnised and registered, certificate issued.' },
    ],
  },
  {
    slug: 'marriage-registration',
    title: 'Marriage Registration',
    category: 'Family',
    summary: 'Register an already-solemnised marriage and get the certificate.',
    description:
      `Registration of a marriage already performed by religious ceremony, under the Hindu Marriage Act or your state's compulsory registration rules. Needed for passports, visas, bank nominations and spouse benefits. ${EXTRA}`,
    price: 3499,
    mrp: 5999,
    turnaround: '7–15 working days, depending on the registrar',
    includes: [
      'Document review',
      'Application and affidavits',
      'Appointment with the registrar',
      'Assistance at the registrar’s office',
      'Marriage certificate',
    ],
    documentsRequired: [
      'Wedding invitation card and photographs',
      'Age and address proof of both spouses',
      'Passport-size photographs',
      'ID proof of two witnesses',
    ],
    howItWorks: [
      { title: 'Share documents', description: 'We check they meet your registrar’s list.' },
      { title: 'Application', description: 'Filed with affidavits, appointment booked.' },
      { title: 'Visit', description: 'Both spouses and witnesses appear once.' },
      { title: 'Certificate', description: 'Issued by the registrar.' },
    ],
  },

  // ── Criminal ────────────────────────────────────────────────────────────
  {
    slug: 'anticipatory-bail-application',
    title: 'Anticipatory Bail Application',
    category: 'Criminal',
    summary: 'Protection from arrest, applied for before the Sessions Court.',
    description:
      `If you fear arrest in an FIR or complaint, an application under Section 482 of the BNSS (formerly Section 438 CrPC) asks the Sessions Court for pre-arrest bail. Includes urgent drafting, filing and arguments at the first hearing in the Sessions Court. High Court applications are quoted separately. ${EXTRA}`,
    price: 14999,
    mrp: 24999,
    turnaround: 'Filed within 24–48 hours of documents',
    includes: [
      'Urgent consultation with a criminal lawyer',
      'Review of the FIR / complaint',
      'Anticipatory bail application under Section 482 BNSS',
      'Filing and arguments in the Sessions Court',
    ],
    documentsRequired: [
      'Copy of the FIR or complaint, if available',
      'Any notice received from the police',
      'Your ID and address proof',
      'Documents supporting your side',
    ],
    howItWorks: [
      { title: 'Urgent call', description: 'A criminal lawyer reviews the allegations the same day.' },
      { title: 'Application drafted', description: 'Grounds for bail set out with supporting documents.' },
      { title: 'Filed', description: 'Filed in the Sessions Court; interim protection sought.' },
      { title: 'Arguments', description: 'Your lawyer argues for bail at the hearing.' },
    ],
  },
  {
    slug: 'regular-bail-application',
    title: 'Regular Bail Application',
    category: 'Criminal',
    summary: 'Bail for a person already arrested, before the magistrate or Sessions Court.',
    description:
      `For someone in custody, a bail application under Sections 480/483 of the BNSS (formerly Sections 437/439 CrPC) before the magistrate or Sessions Court, depending on the offence. Includes drafting, filing, arguments and help with the surety bond once bail is granted. ${EXTRA}`,
    price: 9999,
    mrp: 17999,
    turnaround: 'Filed within 24–48 hours',
    includes: [
      'Urgent consultation with a criminal lawyer',
      'Bail application in the correct court',
      'Filing and arguments',
      'Guidance on surety and bail bonds',
    ],
    documentsRequired: [
      'FIR number and police station',
      'Arrest memo / remand papers, if available',
      'ID and address proof of the accused and the surety',
    ],
    howItWorks: [
      { title: 'Call', description: 'Tell the lawyer the FIR details and the court.' },
      { title: 'Application', description: 'Drafted and filed in the right court.' },
      { title: 'Hearing', description: 'Your lawyer argues for bail.' },
      { title: 'Release', description: 'Bail bonds and surety handled for release.' },
    ],
  },
  {
    slug: 'fir-quashing-petition',
    title: 'FIR Quashing Petition (High Court)',
    category: 'Criminal',
    summary: 'Petition to the High Court to quash a false FIR or a settled case.',
    description:
      `Under Section 528 of the BNSS (formerly Section 482 CrPC), the High Court can quash an FIR that discloses no offence, is an abuse of process, or has been settled between the parties (for example in matrimonial disputes). Includes drafting, filing and arguments at admission. ${EXTRA}`,
    price: 34999,
    mrp: 59999,
    turnaround: 'Filed within 7–10 working days',
    includes: [
      'Case assessment by a High Court advocate',
      'Quashing petition under Section 528 BNSS',
      'Compilation of documents and settlement deed, if any',
      'Filing and arguments at admission',
    ],
    documentsRequired: [
      'Copy of the FIR and charge sheet, if filed',
      'Settlement agreement / compromise deed, if settled',
      'Documents showing the allegations are false',
      'ID proof of the petitioner',
    ],
    howItWorks: [
      { title: 'Assessment', description: 'Whether the FIR can realistically be quashed.' },
      { title: 'Petition drafted', description: 'With the documents the court will look for.' },
      { title: 'Filed', description: 'Filed in the High Court with jurisdiction.' },
      { title: 'Hearing', description: 'Arguments at admission; interim stay sought where possible.' },
    ],
  },
  {
    slug: 'police-complaint-drafting',
    title: 'Police Complaint / FIR Drafting',
    category: 'Criminal',
    summary: 'A complaint drafted by a lawyer, so the right sections are invoked.',
    description:
      'A clear written complaint to the police station — or to the magistrate under Section 175(3) BNSS when the police will not register an FIR — setting out the facts and the offences they make out. A well-drafted complaint is far harder to ignore.',
    price: 1999,
    mrp: 3499,
    turnaround: '1–2 working days',
    includes: [
      'Consultation on what happened',
      'Complaint drafted with the relevant BNS sections',
      'Guidance on where and how to submit it',
      'Follow-up letter to senior officers if the FIR is not registered',
    ],
    documentsRequired: [
      'Your account of events with dates',
      'Any evidence: messages, photos, receipts, witnesses',
      'Your ID proof',
    ],
    howItWorks: [
      { title: 'Tell us', description: 'Share what happened with a lawyer.' },
      { title: 'Drafted', description: 'A complaint that names the right offences.' },
      { title: 'Submit', description: 'You submit it; we guide you through the station.' },
      { title: 'Escalate', description: 'If no FIR, we draft the next step.' },
    ],
  },

  // ── Property ────────────────────────────────────────────────────────────
  {
    slug: 'rera-complaint',
    title: 'RERA Complaint Against Builder',
    category: 'Property',
    summary: 'Complaint for delayed possession, refund or defects before the RERA authority.',
    description:
      `For a delayed flat, a refund with interest, or construction defects, a complaint before your state's Real Estate Regulatory Authority is usually faster than a civil suit. Includes drafting, online filing and appearance at the first hearing. ${EXTRA}`,
    price: 9999,
    mrp: 17999,
    turnaround: 'Filed within 5–7 working days',
    includes: [
      'Review of the builder-buyer agreement and payments',
      'Complaint drafted with interest calculation',
      'Online filing on the state RERA portal',
      'Appearance at the first hearing',
    ],
    documentsRequired: [
      'Builder-buyer agreement / allotment letter',
      'Payment receipts and bank statements',
      'Correspondence with the builder',
      'Project RERA registration number',
    ],
    howItWorks: [
      { title: 'Review', description: 'A property lawyer checks your claim and remedies.' },
      { title: 'Drafted', description: 'Complaint with refund or interest worked out.' },
      { title: 'Filed', description: 'Filed online with the state RERA.' },
      { title: 'Hearing', description: 'Your lawyer appears before the authority.' },
    ],
  },
  {
    slug: 'tenant-eviction-notice',
    title: 'Tenant Eviction Notice',
    category: 'Property',
    summary: 'Legal notice to a tenant to vacate or pay arrears.',
    description:
      'A notice terminating the tenancy and demanding vacant possession and any unpaid rent — the necessary first step before an eviction suit. Drafted against your rent agreement and your state’s rent law.',
    price: 2499,
    mrp: 4499,
    turnaround: '2–3 working days',
    includes: [
      'Review of the rent agreement',
      'Eviction / demand notice drafted by an advocate',
      'Dispatch by registered post',
      'Advice on the eviction suit if the tenant does not leave',
    ],
    documentsRequired: [
      'Rent agreement',
      'Rent receipts or bank records',
      'Tenant’s name and address',
      'Ownership proof of the property',
    ],
    howItWorks: [
      { title: 'Share agreement', description: 'We check the notice period your agreement requires.' },
      { title: 'Drafted', description: 'Notice drafted under the applicable rent law.' },
      { title: 'Sent', description: 'Dispatched with proof shared with you.' },
      { title: 'Next steps', description: 'Guidance on filing for eviction if needed.' },
    ],
  },
  {
    slug: 'succession-certificate',
    title: 'Succession Certificate',
    category: 'Property',
    summary: "Court certificate to claim a deceased person's bank balances, shares and debts.",
    description:
      `Banks and companies ask for a succession certificate before releasing a deceased person's deposits, shares or other movable assets when there is no nominee or will. The petition is filed in the civil court and published for objections. ${EXTRA}`,
    price: 14999,
    mrp: 24999,
    turnaround: 'Typically 4–8 months, depending on the court',
    includes: [
      'Petition under the Indian Succession Act',
      'Consent affidavits of other legal heirs',
      'Filing and newspaper publication',
      'Appearances until the certificate is granted',
    ],
    documentsRequired: [
      'Death certificate',
      'Details of the debts/securities (bank statements, share certificates)',
      'Family tree / legal heir details with ID proofs',
      'No-objection affidavits from other heirs',
    ],
    howItWorks: [
      { title: 'Heirs and assets', description: 'We list the heirs and the assets to be claimed.' },
      { title: 'Petition filed', description: 'With consents of the other heirs.' },
      { title: 'Publication', description: 'Notice published; objection period runs.' },
      { title: 'Certificate', description: 'Granted by the court for the banks to act on.' },
    ],
  },
  {
    slug: 'probate-of-will',
    title: 'Probate of Will',
    category: 'Property',
    summary: 'Court proof of a will, so the executor can transfer the estate.',
    description:
      `Probate is the court's certification that a will is genuine. It is mandatory for wills made in Mumbai, Kolkata and Chennai, and often demanded elsewhere by banks and registrars. Includes the petition, citations to heirs, publication and appearances. ${EXTRA}`,
    price: 19999,
    mrp: 34999,
    turnaround: 'Typically 6–12 months if uncontested',
    includes: [
      'Review of the will and the estate',
      'Probate petition and affidavit of assets',
      'Citations to legal heirs and publication',
      'Appearances until probate is granted (uncontested)',
    ],
    documentsRequired: [
      'Original will',
      'Death certificate of the testator',
      'Details and valuation of assets',
      'Details of legal heirs and witnesses to the will',
    ],
    howItWorks: [
      { title: 'Review', description: 'A lawyer checks the will and the estate.' },
      { title: 'Petition', description: 'Filed with the schedule of assets.' },
      { title: 'Citations', description: 'Heirs notified and notice published.' },
      { title: 'Probate', description: 'Granted, so the executor can transfer assets.' },
    ],
  },

  // ── Personal / Documentation ────────────────────────────────────────────
  {
    slug: 'legal-heir-certificate',
    title: 'Legal Heir Certificate',
    category: 'Personal',
    summary: "Certificate naming a deceased person's legal heirs, from the revenue office.",
    description:
      `Needed for pension, insurance, electricity and property mutation after a death. Applied for at the tehsildar / revenue office (or the municipal body in some states), with an affidavit and a local enquiry. ${EXTRA}`,
    price: 4999,
    mrp: 7999,
    turnaround: '15–45 days, depending on the office',
    includes: [
      'Application and family tree affidavit',
      'Filing with the competent authority',
      'Follow-up through the local enquiry',
      'Collection of the certificate',
    ],
    documentsRequired: [
      'Death certificate',
      'ID and address proof of all heirs',
      'Proof of relationship (birth/marriage certificates)',
      'Address proof of the deceased',
    ],
    howItWorks: [
      { title: 'Documents', description: 'We draw up the family tree with you.' },
      { title: 'Application', description: 'Filed with the right office for your state.' },
      { title: 'Enquiry', description: 'Local verification followed up for you.' },
      { title: 'Certificate', description: 'Issued and shared with you.' },
    ],
  },
  {
    slug: 'rti-application',
    title: 'RTI Application Filing',
    category: 'Personal',
    summary: 'Right to Information request drafted and filed online or by post.',
    description:
      'Get information from any government department — the status of a file, a refund, a land record, an inquiry. A lawyer frames the questions so they cannot be dodged and files the RTI; first appeal guidance is included if the reply is unsatisfactory.',
    price: 999,
    mrp: 1999,
    turnaround: '1–2 working days to file; reply due in 30 days',
    includes: [
      'Questions framed by a lawyer',
      'Online / postal filing with the ₹10 fee arranged',
      'Tracking of the reply',
      'Guidance on the first appeal if needed',
    ],
    documentsRequired: [
      'What you want to know, and from which department',
      'Your name and address for the reply',
      'BPL certificate, if claiming fee exemption',
    ],
    howItWorks: [
      { title: 'Tell us', description: 'What information you need.' },
      { title: 'Drafted', description: 'Precise questions under the RTI Act.' },
      { title: 'Filed', description: 'Filed online or by post.' },
      { title: 'Reply', description: 'Tracked; appeal guidance if needed.' },
    ],
  },
  {
    slug: 'reply-to-legal-notice',
    title: 'Reply to Legal Notice',
    category: 'Documentation',
    summary: 'A lawyer-drafted reply to any legal notice you have received.',
    description:
      'Ignoring a legal notice, or answering it yourself, can hurt you later in court. An advocate reviews the notice, denies what should be denied, puts your side on record and sends the reply.',
    price: 1999,
    mrp: 3999,
    turnaround: '2–3 working days',
    includes: [
      'Review of the notice with a lawyer',
      'Reply drafted on the advocate’s letterhead',
      'Dispatch by registered post / email',
      'Advice on next steps',
    ],
    documentsRequired: [
      'The legal notice received',
      'Documents supporting your side',
      'Any earlier correspondence',
    ],
    howItWorks: [
      { title: 'Share the notice', description: 'A lawyer reviews it with you.' },
      { title: 'Drafted', description: 'Reply prepared for your approval.' },
      { title: 'Sent', description: 'Dispatched with proof.' },
      { title: 'Next steps', description: 'What to expect if they go to court.' },
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
