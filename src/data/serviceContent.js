/**
 * Long-form content for each practice area, keyed by the service NAME as it
 * appears in CATEGORIES (not the slug, so a URL change never orphans it).
 *
 * Every practice-area page is built from this. Without it each page had only a
 * one-line description and a single paragraph, which made all twelve read the
 * same and left the layout half empty.
 *
 * Shape:
 *   intro          two paragraphs replacing the old single `overview`
 *   whenToConsult  concrete situations a visitor will recognise as their own
 *   whatLawyerDoes what the lawyer actually does, in verbs
 *   documents      what to bring to the first consultation
 *   process        how the matter typically moves, start to finish
 *   faqs           questions specific to this area (generic ones are appended
 *                  by the page itself)
 *
 * This is general legal information, not advice on any particular matter.
 */
export const SERVICE_CONTENT = {
  'Civil Law': {
    intro: [
      'Civil law settles disputes between private parties — two individuals, a person and a company, or two businesses — where no crime is alleged. What a civil court gives you is compensation, possession, an injunction or a declaration of rights; not imprisonment.',
      'Most civil matters in India begin with a legal notice and, if that fails, a suit under the Code of Civil Procedure, 1908. A civil lawyer drafts the pleadings, assembles documentary evidence, argues interim applications such as a stay or temporary injunction, and represents you through trial and appeal.',
    ],
    whenToConsult: [
      { title: 'Someone has occupied your property', text: 'A tenant refuses to vacate, a relative claims a share, or a neighbour has encroached on your land.' },
      { title: 'Money you are owed is not coming back', text: 'A loan, an unpaid invoice or an advance where the other side has simply stopped responding.' },
      { title: 'A contract has been broken', text: 'The other party has not delivered, not paid, or walked away from an agreement you signed.' },
      { title: 'You have received a legal notice', text: 'Replying correctly and within time often decides how the entire case goes later.' },
      { title: 'Family property needs dividing', text: 'Joint or ancestral property where the co-owners cannot agree on shares.' },
      { title: 'You need the court to stop something', text: 'An urgent injunction to halt a sale, a construction or a transfer until the dispute is decided.' },
    ],
    whatLawyerDoes: [
      'Sends and replies to legal notices before the dispute reaches court.',
      'Drafts the plaint, the written statement and all supporting applications.',
      'Files for interim relief — stay, temporary injunction or attachment before judgment.',
      'Leads evidence, examines witnesses and cross-examines the other side.',
      'Argues before the civil court and appeals to the District or High Court.',
      'Negotiates settlements and records them through mediation or a compromise decree.',
    ],
    documents: [
      'Sale deed, title documents or the agreement relating to the property',
      'The contract, invoices, receipts or loan papers in dispute',
      'Any legal notice you sent or received, with proof of dispatch',
      'Bank statements showing the payments made or received',
      'Correspondence with the other party — emails, letters, WhatsApp chats',
      'Identity proof and, for property matters, the latest tax receipt or mutation record',
    ],
    process: [
      { title: 'Consultation and document review', text: 'The lawyer reads your papers, identifies the cause of action, and tells you which court has jurisdiction and what relief is realistic.' },
      { title: 'Legal notice', text: 'A formal notice gives the other side a chance to settle. A good number of disputes end here, without a suit ever being filed.' },
      { title: 'Filing the suit', text: 'The plaint is filed with court fees. Urgent interim applications are moved at the same time, so the position on the ground does not change while the case runs.' },
      { title: 'Trial and judgment', text: 'Framing of issues, evidence, cross-examination and final arguments, followed by a decree — which can then be executed.' },
    ],
    faqs: [
      { q: 'How long does a civil case take in India?', a: 'It varies widely with the court and the complexity. A straightforward money-recovery suit may take two to three years; a contested property or partition suit usually runs longer. Interim relief, however, can come within weeks of filing.' },
      { q: 'What is the limitation period for a civil suit?', a: 'The Limitation Act, 1963 fixes it by the type of claim — commonly three years for money recovery and contract breaches, and twelve years for suits relating to immovable property. The clock generally starts when the right to sue arises, so delay can be fatal to an otherwise good case.' },
      { q: 'Can I file a civil case without a lawyer?', a: 'You are allowed to appear in person, but civil procedure is technical. A defect in the plaint, the wrong court, or a missed limitation period can end the case before it is ever heard on merits.' },
      { q: 'What does a civil case cost?', a: 'Court fee is calculated on the value of the claim and varies by state. The lawyer’s fee is separate and depends on the matter and the number of hearings. Ask for the fee structure in the first consultation itself.' },
    ],
  },

  'Criminal Law': {
    intro: [
      'Criminal law deals with acts the state treats as offences against society. The case is prosecuted by the state rather than by the complainant, and what is at stake is liberty — bail, conviction, sentence. That is why the first few hours after an FIR often matter more than anything that follows.',
      'The process now runs under the Bharatiya Nyaya Sanhita and the Bharatiya Nagarik Suraksha Sanhita, which replaced the IPC and CrPC in July 2024. A criminal lawyer intervenes at every stage: the police station, the bail application, framing of charge, trial, and appeal before the Sessions Court, High Court or Supreme Court.',
    ],
    whenToConsult: [
      { title: 'An FIR has been registered against you', text: 'Anticipatory bail is often possible before arrest — the window is narrow and closes the moment you are taken into custody.' },
      { title: 'You or a family member has been arrested', text: 'A bail application should be moved at the first available hearing. Every day in custody counts.' },
      { title: 'The police have called you for questioning', text: 'A notice does not mean arrest, but whatever you say is recorded and used later.' },
      { title: 'A false case has been filed', text: 'Quashing before the High Court can end a malicious prosecution without sitting through a full trial.' },
      { title: 'You are the victim of an offence', text: 'Getting an FIR properly registered, and keeping the investigation moving, takes its own legal effort.' },
      { title: 'A cheque you received has bounced', text: 'Section 138 proceedings run on strict timelines for both the notice and the complaint.' },
    ],
    whatLawyerDoes: [
      'Applies for anticipatory or regular bail and argues it before the Magistrate, Sessions Court or High Court.',
      'Attends the police station and ensures your rights during arrest and interrogation are respected.',
      'Files petitions to quash an FIR or chargesheet where no offence is made out.',
      'Examines the chargesheet and argues for discharge before charges are framed.',
      'Conducts the trial — cross-examines prosecution witnesses and leads your defence.',
      'Files appeals, revisions and suspension-of-sentence applications after conviction.',
    ],
    documents: [
      'Copy of the FIR, and the chargesheet if it has been filed',
      'Any notice or summons received from the police or the court',
      'Arrest memo and remand order, where there has been an arrest',
      'Identity and address proof, and documents supporting a bail surety',
      'Evidence supporting your version — messages, call records, CCTV, receipts',
      'Medical records or the medico-legal report, where injuries are alleged',
    ],
    process: [
      { title: 'Immediate steps', text: 'The lawyer obtains the FIR, assesses whether the offence is bailable, and moves for anticipatory bail if arrest appears likely.' },
      { title: 'Bail', text: 'The application is argued on the merits, the role attributed to you and the stage of investigation. Conditions and sureties are settled here.' },
      { title: 'Charge or discharge', text: 'Once the chargesheet is filed, the defence argues for discharge. If charges are framed, the matter goes to trial.' },
      { title: 'Trial and appeal', text: 'Prosecution evidence, cross-examination, defence evidence and final arguments. An adverse judgment can be appealed, with the sentence suspended in the meantime.' },
    ],
    faqs: [
      { q: 'What is the difference between anticipatory bail and regular bail?', a: 'Anticipatory bail is applied for before arrest and protects you from being taken into custody; it is heard only by the Sessions Court or the High Court. Regular bail is applied for after arrest, and can be moved before the Magistrate.' },
      { q: 'Can an FIR be cancelled or withdrawn?', a: 'A complainant cannot simply withdraw an FIR in a non-compoundable offence. It can, however, be quashed by the High Court under its inherent powers — commonly where the parties have genuinely settled a private dispute, or where the FIR discloses no offence at all.' },
      { q: 'How soon should I contact a criminal lawyer?', a: 'Immediately. The most valuable interventions — anticipatory bail, a properly recorded statement, preserving evidence — are only available early. Once the chargesheet is filed, the options narrow considerably.' },
      { q: 'Will I have to appear in court at every hearing?', a: 'Not always. For routine dates the lawyer can usually seek exemption from personal appearance. Attendance is mandatory at framing of charge, recording of your statement, and judgment.' },
    ],
  },

  'Family Law': {
    intro: [
      'Family law governs the relationships people are born into and the ones they choose — marriage, separation, children, maintenance and inheritance. In India it is not one statute but several, and which applies depends on the religion of the parties or on whether the marriage was solemnised under the Special Marriage Act.',
      'These matters are as much emotional as legal, and the right lawyer is the one who tells you plainly what is achievable. Most family disputes pass through mediation before they are contested, and a settlement reached there is almost always faster, cheaper and less damaging than a decade of litigation.',
    ],
    whenToConsult: [
      { title: 'You want a divorce', text: 'Whether by mutual consent or contested, the grounds and the waiting period differ by the law that governs your marriage.' },
      { title: 'Custody of a child is in dispute', text: 'Courts decide by the welfare of the child, not by the preference of either parent.' },
      { title: 'Maintenance is not being paid', text: 'Interim maintenance can be ordered while the main case is still running.' },
      { title: 'You are facing domestic violence', text: 'Protection, residence and monetary orders are available under the Domestic Violence Act, 2005.' },
      { title: 'An inheritance is being denied', text: 'Succession rights — particularly daughters’ rights in ancestral property — are often wrongly assumed to be settled.' },
      { title: 'You are adopting a child', text: 'Adoption must follow the correct statute and be recorded properly to be legally secure.' },
    ],
    whatLawyerDoes: [
      'Files or defends divorce petitions, and drafts mutual-consent terms that hold up later.',
      'Argues custody, guardianship and visitation before the Family Court.',
      'Claims or resists maintenance and alimony, including interim relief.',
      'Obtains protection, residence and monetary orders in domestic violence matters.',
      'Handles succession certificates, wills and the partition of family property.',
      'Represents you in mediation, where most family matters are actually resolved.',
    ],
    documents: [
      'Marriage certificate, or proof of the marriage such as photographs and invitations',
      'Birth certificates of the children',
      'Income proof of both spouses — salary slips, ITRs, bank statements',
      'Any existing court orders, complaints or FIRs between the parties',
      'Property documents, where property or maintenance is in issue',
      'Medical or police records, where cruelty or violence is alleged',
    ],
    process: [
      { title: 'Consultation in confidence', text: 'The lawyer establishes which law governs your marriage, what relief is realistic, and whether a settlement is worth attempting first.' },
      { title: 'Petition or notice', text: 'The petition is filed before the Family Court having jurisdiction — usually where the marriage took place or where the parties last lived together.' },
      { title: 'Mediation and interim orders', text: 'The court refers most matters to mediation. Interim maintenance and custody arrangements are decided while that runs.' },
      { title: 'Trial or consent decree', text: 'A settlement is recorded as a consent decree. If it fails, evidence is led and the court decides.' },
    ],
    faqs: [
      { q: 'How long does a mutual-consent divorce take?', a: 'The statute provides a six-month cooling-off period between the first and second motion. The Supreme Court has held that this period can be waived by the Family Court where the separation has been long and the settlement is genuine, so some matters do conclude within a few months.' },
      { q: 'Does the mother automatically get custody?', a: 'No. Custody is decided on the welfare of the child. Courts do lean towards the mother for very young children, but schooling, stability and — for an older child — the child’s own preference all weigh in.' },
      { q: 'Can a daughter claim a share in ancestral property?', a: 'Yes. Since the 2005 amendment to the Hindu Succession Act a daughter is a coparcener by birth, with the same rights as a son. The Supreme Court confirmed in 2020 that this applies whether or not the father was alive on the date of the amendment.' },
      { q: 'Is maintenance payable even if the wife is earning?', a: 'It can be. The court looks at the standard of living during the marriage and the gap between the two incomes, not merely at whether the claimant has some income of her own.' },
    ],
  },

  'Property Law': {
    intro: [
      'Property is the largest transaction most Indian families ever make, and also the one most often done on trust. Property law covers everything from verifying that a seller actually owns what they are selling, to registering the transfer, to fighting for possession when someone will not hand it over.',
      'The bulk of property litigation traces back to something skipped at the buying stage — an unverified title, an unregistered agreement, a missing succession record. A property lawyer costs far less before the purchase than after the dispute.',
    ],
    whenToConsult: [
      { title: 'You are buying property', text: 'Title verification and a properly drafted sale agreement prevent almost every dispute that follows.' },
      { title: 'A tenant will not vacate', text: 'Eviction follows the rent-control law of your state, and the notice has to be right.' },
      { title: 'Co-owners cannot agree', text: 'A partition suit divides jointly held property by metes and bounds, or by sale and division of proceeds.' },
      { title: 'Someone has encroached', text: 'An injunction can stop construction while the boundary dispute is decided.' },
      { title: 'Records are not in your name', text: 'Mutation and revenue-record corrections after an inheritance or a purchase.' },
      { title: 'A builder has not delivered', text: 'Possession delays and construction defects have their own, faster remedies under RERA.' },
    ],
    whatLawyerDoes: [
      'Conducts title search and due diligence, and reports on encumbrances before you pay.',
      'Drafts and vets sale agreements, gift deeds, wills, leases and relinquishment deeds.',
      'Handles registration, stamp duty and mutation of revenue records.',
      'Files partition, possession, declaration and injunction suits.',
      'Conducts eviction proceedings under the applicable rent-control legislation.',
      'Represents you before RERA, revenue authorities and civil courts.',
    ],
    documents: [
      'Sale deed and the chain of previous title deeds',
      'Encumbrance certificate covering the last 13 to 30 years',
      'Latest property tax receipts and the mutation or khata extract',
      'Approved building plan and occupancy certificate, for constructed property',
      'Agreement to sell, allotment letter or builder-buyer agreement',
      'Succession certificate, will or legal-heir certificate, for inherited property',
    ],
    process: [
      { title: 'Title due diligence', text: 'The chain of ownership is traced, the encumbrance certificate examined, and any litigation pending on the property identified.' },
      { title: 'Documentation', text: 'The agreement or deed is drafted with the payment schedule, possession date and consequences of default spelt out.' },
      { title: 'Registration', text: 'Stamp duty is computed and the instrument registered before the Sub-Registrar. An unregistered sale deed transfers nothing at all.' },
      { title: 'Mutation and possession', text: 'Revenue records are updated in your name and physical possession is handed over — or enforced through court where it is withheld.' },
    ],
    faqs: [
      { q: 'Is an unregistered sale agreement valid?', a: 'An agreement to sell can be enforced for specific performance even if unregistered, but it does not transfer ownership. A sale deed for immovable property must be registered under the Registration Act, 1908; without registration, no title passes.' },
      { q: 'What is an encumbrance certificate and why does it matter?', a: 'It is a record from the Sub-Registrar of every registered transaction on the property over a period, revealing mortgages, prior sales and attachments. Buying without checking it is how people end up paying for property already pledged to a bank.' },
      { q: 'How long does a partition suit take?', a: 'Contested partition suits commonly run several years, because they involve tracing the family tree and valuing the property. A partition by mutual agreement, recorded through a registered partition deed, avoids all of it.' },
      { q: 'Can NRI-owned property be sold through a power of attorney?', a: 'Yes, but the power of attorney must be specific, properly executed and — if made abroad — notarised or attested at the Indian consulate and then adjudicated for stamp duty in India. A general power of attorney does not by itself transfer ownership.' },
    ],
  },

  'Corporate Law': {
    intro: [
      'Corporate law is what keeps a business legally sound as it grows — from choosing the right structure at incorporation, to the contracts it signs, to the compliances it must file each year, to the disputes it eventually has to resolve.',
      'Most corporate problems are documentation problems that surfaced late: a shareholders’ agreement nobody drafted, a vendor contract with no termination clause, a filing missed for three years running. A corporate lawyer’s real value lies in preventing those.',
    ],
    whenToConsult: [
      { title: 'You are starting a company', text: 'Private limited, LLP or OPC — the structure decides your liability, your tax and your ability to raise money.' },
      { title: 'You are signing a significant contract', text: 'A vendor, client, employment or distribution agreement worth reading properly before it binds you.' },
      { title: 'You are raising funding', text: 'Term sheets, due diligence and shareholders’ agreements shape control long after the money arrives.' },
      { title: 'Co-founders or shareholders are in conflict', text: 'Oppression and mismanagement petitions lie before the NCLT.' },
      { title: 'A customer or supplier has defaulted', text: 'Recovery through arbitration, a commercial suit, or proceedings under the IBC.' },
      { title: 'Compliance filings are overdue', text: 'ROC penalties accrue daily, and directors of a persistently defaulting company can be disqualified.' },
    ],
    whatLawyerDoes: [
      'Incorporates companies and LLPs and drafts the constitutional documents.',
      'Drafts, reviews and negotiates commercial contracts of every kind.',
      'Runs due diligence for acquisitions, investments and joint ventures.',
      'Maintains ROC and secretarial compliance, and regularises past defaults.',
      'Represents the company before the NCLT, the NCLAT and in arbitration.',
      'Advises on IBC proceedings, whether as creditor or corporate debtor.',
    ],
    documents: [
      'Certificate of incorporation, MOA and AOA',
      'Shareholding pattern and any shareholders’ or founders’ agreement',
      'The contract or term sheet in question',
      'Latest audited financials and ROC filings',
      'Board and shareholder resolutions relevant to the matter',
      'Correspondence with the other party, and any notice received',
    ],
    process: [
      { title: 'Scoping', text: 'The lawyer establishes the commercial objective first — what the business actually wants — and only then the legal route to it.' },
      { title: 'Documentation or diligence', text: 'Agreements are drafted or reviewed. For a transaction, a diligence report flags the risks that are worth negotiating on.' },
      { title: 'Execution and filing', text: 'Documents are executed, stamped and, where required, filed with the ROC or the relevant regulator within the statutory time.' },
      { title: 'Dispute resolution, if it comes to that', text: 'Notice, followed by arbitration or proceedings before the NCLT or a commercial court, depending on what the contract provides.' },
    ],
    faqs: [
      { q: 'Private limited company or LLP — which should I choose?', a: 'An LLP is cheaper to run and has lighter compliance, which suits a services business with stable partners. A private limited company is almost always necessary if you intend to raise external investment, issue ESOPs, or bring in shareholders who are not managing the business.' },
      { q: 'Do I need a shareholders’ agreement if we are only two founders?', a: 'Especially then. It settles vesting, exit, deadlock and what happens if one of you leaves — questions that are easy to agree on today and impossible to agree on later.' },
      { q: 'What happens if ROC filings are missed?', a: 'Late fees accrue per day of delay with no upper cap for most forms, the company can be struck off, and directors of a company that defaults for three consecutive years are disqualified from all boards for five years.' },
      { q: 'Is arbitration better than going to court?', a: 'It is usually faster and private, and the parties choose the arbitrator. It is not cheaper. And it only applies if your contract contains an arbitration clause — one more reason to have a lawyer read the contract before you sign it.' },
    ],
  },

  'Tax Law': {
    intro: [
      'Tax law is where an ordinary business decision meets an assessing officer’s interpretation of it. Most tax disputes in India are not about evasion at all — they are about characterisation, timing, or a mismatch the system flagged automatically.',
      'Almost every stage carries a strict deadline: thirty days to reply to a notice, thirty days to appeal, and very little discretion once it lapses. A tax lawyer’s first job is usually to protect the timeline; the second is to build a record now that will survive appeal later.',
    ],
    whenToConsult: [
      { title: 'You have received a notice', text: 'A scrutiny, reassessment or show-cause notice — the reply is the single most important document in the whole case.' },
      { title: 'Your return has been picked for scrutiny', text: 'Section 143(2) proceedings need documentation assembled in a particular way.' },
      { title: 'A GST demand has been raised', text: 'Input credit mismatches and classification disputes are the most common triggers.' },
      { title: 'A refund is stuck', text: 'Refunds withheld or adjusted against other demands can be pursued through appeal or writ.' },
      { title: 'You want to appeal an order', text: 'CIT(A), ITAT, High Court and Supreme Court each carry their own limitation period.' },
      { title: 'A transaction needs planning', text: 'Capital gains, restructuring or cross-border payments are far cheaper to plan than to defend.' },
    ],
    whatLawyerDoes: [
      'Drafts replies to scrutiny, reassessment and show-cause notices.',
      'Represents you before the assessing officer and the appellate authorities.',
      'Files and argues appeals before CIT(A), the ITAT and the High Court.',
      'Handles GST assessments, audits and input tax credit disputes.',
      'Pursues withheld refunds and rectification applications.',
      'Advises on capital gains, TDS obligations and transaction structuring.',
    ],
    documents: [
      'The notice or order received, with its DIN and date of service',
      'Income tax returns and computation for the years in question',
      'Form 26AS, AIS and TIS statements',
      'Audited financials, books of account and the tax audit report',
      'GST returns — GSTR-1, GSTR-3B and 2A/2B reconciliations',
      'Invoices, contracts and bank statements supporting the disputed entries',
    ],
    process: [
      { title: 'Read the notice properly', text: 'The section it is issued under, the assessment year and the date of service decide everything — including whether it is already time-barred.' },
      { title: 'Reply with a record', text: 'The reply is filed with documentary support. Everything you may want to rely on later has to go on record at this stage.' },
      { title: 'Assessment and order', text: 'Hearings before the assessing officer, followed by the assessment order and any demand raised on it.' },
      { title: 'Appeal', text: 'Appeal to CIT(A) within thirty days, with a stay application against recovery. Further appeal lies to the ITAT, and then to the High Court on a question of law.' },
    ],
    faqs: [
      { q: 'What should I do the day I receive an income tax notice?', a: 'Note the section and the date of service, and work out the deadline — usually thirty days. Do not ignore it: an ex-parte best-judgment assessment is much harder to undo than a notice answered on time. Verify the notice on the income tax portal using its DIN before acting on it.' },
      { q: 'Can I appeal a tax demand without paying it?', a: 'Filing an appeal does not stay recovery automatically. In practice a stay is granted on deposit of twenty per cent of the disputed demand, though the appellate authority can direct a lower amount where the case is strong.' },
      { q: 'How long do I have to appeal?', a: 'Thirty days from the date the order is served, both for an appeal to CIT(A) and to the ITAT. Delay can be condoned on sufficient cause, but that is discretionary and not something to rely on.' },
      { q: 'Do I need a lawyer, or is a CA enough?', a: 'A chartered accountant handles compliance, returns and representation before the assessing officer well. A tax lawyer becomes necessary once the matter turns on interpretation, or moves to the ITAT, the High Court or a writ petition, where legal argument rather than computation decides it.' },
    ],
  },

  'Labour & Employment': {
    intro: [
      'Employment law sits between two parties with very unequal bargaining power, and Indian law tries to correct that balance — through the industrial dispute machinery, statutory dues such as gratuity and provident fund, and protections against unfair dismissal and workplace harassment.',
      'Employers face the mirror image: getting terminations, contracts and POSH compliance right so that a routine business decision does not become a labour court matter three years later. Most employment disputes turn on documentation, and on whether the correct procedure was followed.',
    ],
    whenToConsult: [
      { title: 'You have been terminated', text: 'Whether notice, dues and procedure were correct decides whether the termination stands.' },
      { title: 'Salary or dues are unpaid', text: 'Wages, gratuity, provident fund and full-and-final settlement each have their own recovery route.' },
      { title: 'You are asked to sign an exit document', text: 'Releases and restrictive covenants signed under pressure are often the real problem later.' },
      { title: 'There is harassment at work', text: 'The POSH Act requires an Internal Committee and a time-bound inquiry.' },
      { title: 'You are drafting employment contracts', text: 'Notice period, confidentiality and clauses that are actually enforceable in India.' },
      { title: 'A union or industrial dispute has arisen', text: 'Conciliation, reference and proceedings before the Labour Court.' },
    ],
    whatLawyerDoes: [
      'Challenges wrongful termination and claims reinstatement or compensation.',
      'Recovers unpaid wages, gratuity, PF, ESI and severance dues.',
      'Drafts and reviews employment contracts, policies and separation agreements.',
      'Advises on POSH compliance and represents parties in Internal Committee inquiries.',
      'Represents employers and employees before Labour Courts and Industrial Tribunals.',
      'Handles retrenchment, layoff and closure compliance.',
    ],
    documents: [
      'Appointment letter and employment contract',
      'Salary slips for the last twelve months, and Form 16',
      'Termination, resignation or show-cause letter',
      'Company HR policy or employee handbook',
      'PF and ESI statements, and the gratuity computation',
      'Emails and correspondence around the dispute',
    ],
    process: [
      { title: 'Assess the relationship', text: 'Whether you are a “workman” under the Industrial Disputes Act changes which forum hears the matter and what relief is available.' },
      { title: 'Demand or notice', text: 'A legal notice setting out the dues and the illegality of the action, which also fixes the record early.' },
      { title: 'Conciliation', text: 'Many industrial disputes must pass through the Conciliation Officer before they can be referred to a Labour Court.' },
      { title: 'Adjudication', text: 'Proceedings before the Labour Court, the Industrial Tribunal, or the authority under the Payment of Wages or Gratuity Act.' },
    ],
    faqs: [
      { q: 'Can an employer terminate without notice?', a: 'Only for proven misconduct, and after a proper domestic inquiry. Otherwise the contract’s notice period or pay in lieu applies, and for a “workman” with a year of continuous service the Industrial Disputes Act additionally requires one month’s notice and retrenchment compensation.' },
      { q: 'Am I entitled to gratuity?', a: 'Yes, if you have completed five years of continuous service with an establishment covered by the Payment of Gratuity Act. The five-year condition does not apply where service ends because of death or disablement.' },
      { q: 'Is a non-compete clause enforceable in India?', a: 'A restraint on employment after the job ends is generally void under Section 27 of the Contract Act. Confidentiality and non-solicitation obligations are enforceable; a blanket bar on joining a competitor usually is not.' },
      { q: 'What is the time limit to challenge a termination?', a: 'There is no single fixed limit, but an industrial dispute should be raised without unreasonable delay, and courts have refused relief where a workman waited years. Speak to a lawyer within weeks, not months.' },
    ],
  },

  'Constitutional Law': {
    intro: [
      'Constitutional law is what you turn to when the other side is the state. It is the remedy for arbitrary government action — a licence refused without reason, a service benefit denied, a detention without cause, a policy that discriminates.',
      'The remedy is a writ petition before the High Court under Article 226, or the Supreme Court under Article 32. It moves faster than a civil suit because it is decided on affidavits rather than oral evidence, but it is available only where a legal or fundamental right has been infringed — not for every grievance against a government office.',
    ],
    whenToConsult: [
      { title: 'A government order has gone against you', text: 'An arbitrary or unreasoned administrative decision can be quashed by writ.' },
      { title: 'A service matter is stuck', text: 'Promotion, seniority, pension and disciplinary action in government employment.' },
      { title: 'Someone is unlawfully detained', text: 'Habeas corpus is heard on priority and can be moved by any person, not only the detenu.' },
      { title: 'A public wrong needs addressing', text: 'A PIL, where the affected class cannot realistically approach the court itself.' },
      { title: 'A statute or rule is unconstitutional', text: 'Challenges to legislation on the ground that it violates fundamental rights.' },
      { title: 'An election dispute has arisen', text: 'Election petitions carry their own strict procedure and limitation.' },
    ],
    whatLawyerDoes: [
      'Drafts and argues writ petitions before the High Court and the Supreme Court.',
      'Seeks interim stay against the operation of an impugned order.',
      'Files public interest litigation where a class or the public at large is affected.',
      'Handles service matters before Administrative Tribunals and High Courts.',
      'Challenges the vires of statutes, rules and notifications.',
      'Files special leave petitions under Article 136 against adverse judgments.',
    ],
    documents: [
      'The impugned order, notification or communication',
      'Every representation you made to the authority, with proof of submission',
      'The rules, circulars or policy relied on by either side',
      'Service record, appointment and promotion orders, in service matters',
      'Any earlier litigation between you and the same authority',
      'Documents establishing your locus — how exactly you are affected',
    ],
    process: [
      { title: 'Exhaust the remedy available', text: 'Courts usually ask whether you approached the departmental authority first. A representation made and rejected materially strengthens the petition.' },
      { title: 'Draft the petition', text: 'The grounds must identify the legal right infringed and the specific illegality. A writ is not an appeal on the merits of the decision.' },
      { title: 'Admission and interim relief', text: 'The court hears the petition for admission, issues notice, and may stay the impugned order in the meantime.' },
      { title: 'Final hearing', text: 'Counter-affidavit, rejoinder and arguments, followed by judgment. An appeal lies to a Division Bench and then to the Supreme Court.' },
    ],
    faqs: [
      { q: 'What is the difference between Article 32 and Article 226?', a: 'Article 32 lies only to the Supreme Court and only for enforcement of fundamental rights; it is itself a fundamental right. Article 226 lies to the High Court and is wider — it covers fundamental rights and “any other purpose”, meaning ordinary legal rights too. Most matters therefore begin under Article 226.' },
      { q: 'Who can file a PIL?', a: 'Any public-spirited person, even one not personally affected, provided the matter concerns a class that cannot approach the court itself. Courts have become strict about motive — a PIL used to settle a private score attracts costs.' },
      { q: 'Is there a limitation period for a writ petition?', a: 'No statutory limitation applies, but the court will refuse relief on the ground of delay and laches. As a working rule, move within the limitation that would apply to a suit on the same cause, and be ready to explain any delay.' },
      { q: 'Can a writ be filed against a private body?', a: 'Generally no. But a writ does lie against a private body performing a public function, or one substantially controlled or funded by the state — private aided institutions and certain statutory bodies, for example.' },
    ],
  },

  'Consumer Law': {
    intro: [
      'Consumer law exists because the alternative — an ordinary civil suit — costs more than most consumer grievances are worth. The Consumer Protection Act, 2019 gives you a forum with low fees, no compulsory lawyer, and a mandate to decide quickly.',
      'It covers defective goods, deficient services, unfair trade practices and misleading advertisements, and now expressly covers e-commerce and product liability. Complaints can be filed electronically and, importantly, from where you reside rather than where the seller happens to sit.',
    ],
    whenToConsult: [
      { title: 'A product is defective', text: 'Replacement, refund or compensation, including for the loss the defect caused you.' },
      { title: 'A service was deficient', text: 'Banking, insurance, telecom, travel, education and healthcare all fall within it.' },
      { title: 'An insurance claim was rejected', text: 'Repudiation on technical grounds is among the most commonly overturned decisions.' },
      { title: 'An online order went wrong', text: 'E-commerce platforms carry specific obligations under the 2019 Act and its rules.' },
      { title: 'You were misled by an advertisement', text: 'False claims and hidden conditions are unfair trade practices.' },
      { title: 'Medical treatment caused harm', text: 'Medical negligence is actionable as a deficiency in service.' },
    ],
    whatLawyerDoes: [
      'Drafts and files complaints before the District, State or National Commission.',
      'Computes the claim correctly, so that the right forum has jurisdiction.',
      'Argues insurance repudiation and banking deficiency matters.',
      'Handles medical negligence complaints with the expert material they require.',
      'Files appeals and revisions against unfavourable orders.',
      'Executes orders where the compensation awarded is not paid.',
    ],
    documents: [
      'Invoice, bill or receipt proving the purchase',
      'Warranty card, policy document or service agreement',
      'Complaints made to the seller and their replies',
      'Photographs, videos or a technical report showing the defect',
      'Proof of payment, and of any loss suffered',
      'Medical records and expert opinion, in negligence matters',
    ],
    process: [
      { title: 'Notice to the opposite party', text: 'A written complaint to the seller or service provider, which also establishes that you gave them a chance to put it right.' },
      { title: 'Choosing the forum', text: 'Jurisdiction depends on the value paid — District up to fifty lakh, State up to two crore, National above that. You may file where you reside or work.' },
      { title: 'Filing the complaint', text: 'Filed with an affidavit, the documents and the prescribed fee. Filing can be done online through the e-Daakhil portal.' },
      { title: 'Hearing and order', text: 'The Act sets timelines for reply and disposal. Orders can direct refund, replacement, compensation and litigation costs.' },
    ],
    faqs: [
      { q: 'Do I need a lawyer for a consumer complaint?', a: 'No. The Act allows you to appear in person and the procedure is deliberately simple. A lawyer helps where the claim is large, the facts are technical, or the other side is represented — which insurers and hospitals invariably are.' },
      { q: 'What is the time limit for filing?', a: 'Two years from the date the cause of action arose. Delay can be condoned if you satisfy the Commission that there was sufficient cause, supported by a separate application explaining it.' },
      { q: 'Can I file against an online marketplace?', a: 'Yes. The 2019 Act and the E-Commerce Rules place obligations directly on platforms, and you can implead both the seller and the platform. Filing is permitted where you reside, which matters a great deal when the seller is in another state.' },
      { q: 'What compensation can I actually get?', a: 'Refund or replacement, compensation for the loss and mental agony caused, and litigation costs. Punitive damages are possible for unfair trade practice, but consumer forums are generally moderate — expect a fair remedy rather than a windfall.' },
    ],
  },

  'Intellectual Property': {
    intro: [
      'Intellectual property is the legal form given to the things a business creates but cannot lock in a drawer — a brand name, a piece of software, a design, a formula. Registration is what converts them from something you merely use into something you own and can stop others from using.',
      'India recognises trademarks, copyright, patents, designs and geographical indications, each under its own statute, with its own term and its own registry. Copyright arises automatically on creation; trademarks, patents and designs need registration to be properly enforceable.',
    ],
    whenToConsult: [
      { title: 'You are launching a brand', text: 'A clearance search before launch costs a fraction of a rebrand after an objection.' },
      { title: 'Someone is using your mark', text: 'Infringement and passing-off actions, with an interim injunction.' },
      { title: 'You have received an examination report', text: 'Trademark objections have a fixed window for reply, after which the application is abandoned.' },
      { title: 'You have invented something', text: 'Patentability assessment, and a provisional application to secure the priority date.' },
      { title: 'Your content is being copied', text: 'Copyright enforcement, takedown notices and damages.' },
      { title: 'You are licensing or assigning IP', text: 'Scope, royalty and territory need to be written down before, not after.' },
    ],
    whatLawyerDoes: [
      'Conducts clearance searches and files trademark, patent and design applications.',
      'Replies to examination reports and appears at hearings before the registry.',
      'Files and defends oppositions, rectification and cancellation proceedings.',
      'Sends cease-and-desist notices and obtains interim injunctions against infringers.',
      'Drafts licensing, assignment and technology transfer agreements.',
      'Handles online takedowns and domain name disputes.',
    ],
    documents: [
      'The mark, logo, design or work in the exact form to be protected',
      'Proof of first use — invoices, packaging, advertisements, dated screenshots',
      'Details of the goods or services, and the classes they fall in',
      'For patents: the complete technical description, drawings and any prior art known to you',
      'Incorporation documents and identity proof of the applicant',
      'Any objection, opposition or notice already received',
    ],
    process: [
      { title: 'Search and strategy', text: 'A search of the registry and the market shows whether the mark is available and how strong it will be. Weak, descriptive marks cause most later objections.' },
      { title: 'Filing', text: 'The application is filed in the correct class, with the priority date secured from the date of filing.' },
      { title: 'Examination', text: 'The registry issues an examination report. Objections are answered in writing and, where needed, at a hearing.' },
      { title: 'Publication and registration', text: 'The mark is advertised in the journal for opposition. If unopposed, registration follows and runs for ten years, renewable indefinitely.' },
    ],
    faqs: [
      { q: 'How long does trademark registration take in India?', a: 'If unopposed, typically twelve to eighteen months from filing to registration. You may use the ™ symbol from the date of filing, and ® only once registration has been granted.' },
      { q: 'Do I need to register copyright?', a: 'No. Copyright subsists automatically the moment an original work is created. Registration is optional, but it gives you a certificate that serves as prima facie evidence of ownership — which matters considerably in litigation.' },
      { q: 'What is the difference between ™ and ®?', a: '™ can be used by anyone claiming rights in a mark, including on a pending application. ® may be used only for a mark actually registered in India; using it before registration is an offence under the Trade Marks Act.' },
      { q: 'Can I patent software or a business method?', a: 'Computer programmes “per se” and business methods are excluded from patentability under Section 3(k). Software that produces a technical effect, or is claimed in combination with hardware, has been granted patents. How the claims are drafted often decides the outcome more than the invention does.' },
    ],
  },

  'Real Estate / RERA': {
    intro: [
      'RERA was enacted in 2016 because the housing market ran on builder-drafted agreements that were one-sided by design. It created a state-level regulator, made project registration compulsory, and gave allottees a forum that decides in months rather than years.',
      'Its most useful features are practical ones: seventy per cent of collections must sit in a separate account, the carpet area must be stated honestly, and interest for delayed possession is payable at the same rate the builder would have charged you for a delayed payment.',
    ],
    whenToConsult: [
      { title: 'Possession is delayed', text: 'You can claim interest for every month of delay, or withdraw and claim a full refund with interest.' },
      { title: 'The project has stalled', text: 'Refund, or relief through the authority against a defaulting promoter.' },
      { title: 'The flat is not what was promised', text: 'Reduced carpet area, a changed layout, or amenities that never arrived.' },
      { title: 'There are construction defects', text: 'The promoter is liable for structural defects for five years from possession.' },
      { title: 'The builder-buyer agreement is one-sided', text: 'Clauses contrary to RERA are unenforceable, whatever you signed.' },
      { title: 'A society or redevelopment dispute has arisen', text: 'Conveyance, redevelopment agreements and society formation.' },
    ],
    whatLawyerDoes: [
      'Files complaints before the State RERA Authority and the Appellate Tribunal.',
      'Computes and claims delay interest, and refund with interest.',
      'Reviews builder-buyer agreements before you sign them.',
      'Verifies project registration, approvals and the promoter’s track record.',
      'Pursues structural defect claims within the five-year liability period.',
      'Handles society formation, conveyance and redevelopment agreements.',
    ],
    documents: [
      'Allotment letter and the builder-buyer agreement',
      'All payment receipts, and the bank loan sanction if any',
      'The project’s RERA registration number and its registered details',
      'Brochure, advertisement and approved plan as shown to you',
      'Correspondence with the builder about the delay or the defect',
      'Photographs of the defect, and a technical report if obtained',
    ],
    process: [
      { title: 'Verify the project', text: 'The RERA registration number is checked on the state authority’s portal, along with the declared completion date and the approvals filed.' },
      { title: 'Notice to the promoter', text: 'A written demand for possession, interest or refund, which fixes the record before the complaint is filed.' },
      { title: 'Complaint before RERA', text: 'Filed online with the prescribed fee. The authority is required to dispose of it within sixty days, though practice varies between states.' },
      { title: 'Order and execution', text: 'Orders directing interest or refund are executed as a decree. Appeal lies to the Appellate Tribunal within sixty days.' },
    ],
    faqs: [
      { q: 'How much interest can I claim for delayed possession?', a: 'RERA prescribes the same rate the promoter would charge you for a delayed payment — in most states the SBI highest marginal cost of lending rate plus two per cent. The rate has to be reciprocal, so a lower rate written into the agreement is unenforceable.' },
      { q: 'Can I claim a refund instead of waiting for possession?', a: 'Yes. Where the promoter fails to give possession by the agreed date, Section 18 lets you either withdraw and claim a full refund with interest and compensation, or stay in the project and claim interest for each month of delay.' },
      { q: 'Does RERA apply to my project?', a: 'Registration is compulsory for projects over five hundred square metres or eight apartments that were ongoing or launched after the Act came into force in your state. Completed projects that had an occupancy certificate before that date fall outside it, though a consumer complaint remains available.' },
      { q: 'RERA or consumer forum — which should I choose?', a: 'RERA is faster and specialised for possession, refund and interest. Consumer forums remain useful for compensation claims and for projects outside RERA. You cannot pursue the same relief in both at the same time.' },
    ],
  },

  'Immigration Law': {
    intro: [
      'Immigration law governs who may enter, stay, work and settle in a country, and it is unusually unforgiving of paperwork errors. Most refusals are not decisions on merit — they follow from an inconsistent document, an unexplained gap, or a form filled in the wrong way.',
      'For Indian nationals the work spans outbound visas and permanent residency; for those of Indian origin, the OCI, PIO and citizenship route back. The value of a lawyer lies in reading the eligibility criteria against your actual facts before an application is filed and a refusal goes on your permanent record.',
    ],
    whenToConsult: [
      { title: 'A visa has been refused', text: 'A refusal must be disclosed in every future application, so the appeal or reapplication needs real care.' },
      { title: 'You are applying for permanent residency', text: 'Points-based systems reward a correctly assembled profile, not merely a strong one.' },
      { title: 'You need a work permit', text: 'Employer sponsorship, labour certification and choosing the right category.' },
      { title: 'You are applying for OCI or converting a PIO card', text: 'Documentary proof of Indian origin is where most applications stall.' },
      { title: 'A student visa is involved', text: 'Financial documentation and the statement of purpose carry disproportionate weight.' },
      { title: 'You are facing overstay or deportation', text: 'Time-sensitive, and the consequences follow you across countries.' },
    ],
    whatLawyerDoes: [
      'Assesses eligibility honestly, before an application is filed.',
      'Prepares and reviews the full documentation set for internal consistency.',
      'Files appeals and representations against refusals.',
      'Handles OCI, PIO, passport surrender and citizenship applications.',
      'Advises on work permit categories and employer sponsorship.',
      'Represents clients in overstay, deportation and FRRO matters.',
    ],
    documents: [
      'Current and all previous passports, including expired ones',
      'Educational certificates and, where required, a credential evaluation',
      'Employment records — offer letters, salary slips, experience letters',
      'Financial documents showing funds and their source',
      'Proof of Indian origin — birth certificate, parents’ or grandparents’ documents',
      'Any previous refusal letter, together with the reasons given',
    ],
    process: [
      { title: 'Eligibility assessment', text: 'The criteria are applied to your actual profile. A candid assessment at this stage prevents a refusal that would damage later applications.' },
      { title: 'Document assembly', text: 'Every document is checked for consistency — names, dates and employment periods must match across the whole file.' },
      { title: 'Filing and biometrics', text: 'The application is submitted with fees, followed by biometrics and, where required, an interview.' },
      { title: 'Decision or appeal', text: 'On approval, post-landing formalities follow. On refusal, the stated reasons are analysed for an appeal or a corrected reapplication.' },
    ],
    faqs: [
      { q: 'Does a visa refusal affect future applications?', a: 'Yes. Most forms ask whether you have ever been refused a visa by any country, and a false answer is treated as misrepresentation — which is far more damaging than the original refusal. Disclose it, and address the reason that was given.' },
      { q: 'What is the difference between OCI and dual citizenship?', a: 'India does not permit dual citizenship. OCI is a lifelong visa carrying most residency, work and study rights, but it does not give you an Indian passport, the vote, the right to hold constitutional office, or the right to buy agricultural land.' },
      { q: 'Must I surrender my Indian passport after taking foreign citizenship?', a: 'Yes. Indian citizenship ends automatically on acquiring another nationality, and the Indian passport must be surrendered and a surrender certificate obtained. Travelling on it afterwards attracts penalties and complicates the OCI application.' },
      { q: 'Can a lawyer guarantee a visa?', a: 'No — and anyone who does should be avoided. The decision rests entirely with the immigration authority. What a lawyer controls is that the application is eligible, complete, consistent and properly presented.' },
    ],
  },
};

/** Long-form content for one practice area, or null if none is written yet. */
export function getServiceContent(serviceName) {
  return SERVICE_CONTENT[serviceName] || null;
}
