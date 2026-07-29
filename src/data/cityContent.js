/**
 * Per-city content for the city pages, keyed by city slug.
 *
 * A city page is the homepage with one city written into it. What makes each
 * of those pages worth its own address — rather than a hundred copies of the
 * same text with the name swapped — is that the facts below really do differ
 * city to city:
 *
 *   - which High Court the city answers to, and where that court sits
 *   - the kind of disputes the local economy and land tenure generate
 *   - questions a resident of that city would actually ask
 *
 * Shape (every field optional — the page renders what it is given):
 *   intro   [0] goes under the hero heading, [1] under the practice-area grid
 *   focus   matters this city sees more of than most, with a line on each
 *   faqs    questions specific to this city, shown before the general ones
 *
 * The High Court is held once per state in HIGH_COURTS rather than repeated in
 * every entry, so every city gets that line even before its own text is written.
 *
 * This is general information about where and how matters are heard — not
 * advice on any particular case.
 */

/**
 * State / union territory → the High Court with jurisdiction over it.
 * `seat` is where that court sits for this state. Several High Courts cover
 * more than one state, and several have permanent benches away from the seat.
 */
export const HIGH_COURTS = {
  'Delhi': { name: 'Delhi High Court', seat: 'New Delhi' },
  'Maharashtra': { name: 'Bombay High Court', seat: 'Mumbai' },
  'Karnataka': { name: 'Karnataka High Court', seat: 'Bengaluru' },
  'Telangana': { name: 'Telangana High Court', seat: 'Hyderabad' },
  'Tamil Nadu': { name: 'Madras High Court', seat: 'Chennai' },
  'West Bengal': { name: 'Calcutta High Court', seat: 'Kolkata' },
  'Gujarat': { name: 'Gujarat High Court', seat: 'Ahmedabad' },
  'Rajasthan': { name: 'Rajasthan High Court', seat: 'Jodhpur' },
  'Uttar Pradesh': { name: 'Allahabad High Court', seat: 'Prayagraj' },
  'Chandigarh': { name: 'Punjab and Haryana High Court', seat: 'Chandigarh' },
  'Punjab': { name: 'Punjab and Haryana High Court', seat: 'Chandigarh' },
  'Haryana': { name: 'Punjab and Haryana High Court', seat: 'Chandigarh' },
  'Bihar': { name: 'Patna High Court', seat: 'Patna' },
  'Puducherry': { name: 'Madras High Court', seat: 'Chennai' },
  'Lakshadweep': { name: 'Kerala High Court', seat: 'Ernakulam' },
  'Ladakh': { name: 'High Court of Jammu & Kashmir and Ladakh', seat: 'Srinagar and Jammu' },
  'Jammu and Kashmir': { name: 'High Court of Jammu & Kashmir and Ladakh', seat: 'Srinagar and Jammu' },
  'Dadra and Nagar Haveli and Daman and Diu': { name: 'Bombay High Court', seat: 'Mumbai' },
  'Andaman and Nicobar Islands': { name: 'Calcutta High Court', seat: 'Kolkata' },
  'Uttarakhand': { name: 'Uttarakhand High Court', seat: 'Nainital' },
  'Tripura': { name: 'Tripura High Court', seat: 'Agartala' },
  'Sikkim': { name: 'Sikkim High Court', seat: 'Gangtok' },
  'Odisha': { name: 'Orissa High Court', seat: 'Cuttack' },
  'Nagaland': { name: 'Gauhati High Court', seat: 'Guwahati' },
  'Mizoram': { name: 'Gauhati High Court', seat: 'Guwahati' },
  'Meghalaya': { name: 'Meghalaya High Court', seat: 'Shillong' },
  'Manipur': { name: 'Manipur High Court', seat: 'Imphal' },
  'Madhya Pradesh': { name: 'Madhya Pradesh High Court', seat: 'Jabalpur' },
  'Kerala': { name: 'Kerala High Court', seat: 'Ernakulam' },
  'Jharkhand': { name: 'Jharkhand High Court', seat: 'Ranchi' },
  'Himachal Pradesh': { name: 'Himachal Pradesh High Court', seat: 'Shimla' },
  'Goa': { name: 'Bombay High Court at Goa', seat: 'Panaji' },
  'Chhattisgarh': { name: 'Chhattisgarh High Court', seat: 'Bilaspur' },
  'Assam': { name: 'Gauhati High Court', seat: 'Guwahati' },
  'Arunachal Pradesh': { name: 'Gauhati High Court', seat: 'Guwahati' },
  'Andhra Pradesh': { name: 'Andhra Pradesh High Court', seat: 'Amaravati' },
};

export const CITY_CONTENT = {
  delhi: {
    intro: [
      'Delhi carries a denser concentration of courts than anywhere else in India — six district complexes at Tis Hazari, Patiala House, Karkardooma, Saket, Rohini and Dwarka, the Delhi High Court above them, and the Supreme Court within reach of all of it.',
      'That density also gives Delhi tribunals most cities do not have: the NCLT for company matters, the DRT for bank recoveries, CAT for central government service disputes, and the National Green Tribunal. A Delhi lawyer will often tell you at the first meeting that your dispute belongs before a tribunal rather than a civil court — which changes both the timeline and the cost.',
    ],
    focus: [
      { title: 'Property and tenancy', text: 'Builder-buyer disputes, delayed possession, sealing notices, and landlord-tenant cases under the Delhi Rent Control Act.' },
      { title: 'Matrimonial and family', text: 'The family courts at Saket, Rohini, Dwarka and Karkardooma carry heavy divorce, maintenance and custody lists.' },
      { title: 'Company and insolvency', text: 'The NCLT Principal Bench sits in Delhi, so insolvency and company petitions are filed here from across the country.' },
      { title: 'Service and government matters', text: 'CAT claims and writ petitions against central departments — a category almost unique to the capital in this volume.' },
    ],
    faqs: [
      { q: 'Which district court in Delhi will hear my case?', a: 'It follows the district where the cause of action arose or where the opposite party resides — Tis Hazari for Central and West, Karkardooma for East and Shahdara, Saket for South, Rohini for North-West, Dwarka for South-West and Patiala House for New Delhi. A case filed in the wrong complex is returned, so jurisdiction is confirmed before filing.' },
      { q: 'Can I file a case in Delhi if the dispute happened elsewhere?', a: 'Only if part of the cause of action arose in Delhi, or the defendant resides or works for gain here. Contracts sometimes name Delhi as the agreed forum, which is another basis. Otherwise the suit belongs where the events occurred.' },
    ],
  },

  mumbai: {
    intro: [
      'Mumbai is the seat of the Bombay High Court, which is unusual in also exercising original civil jurisdiction — suits above a threshold value are filed in the High Court itself rather than starting in a district court. Below it sit the City Civil and Sessions Court and the metropolitan magistrate courts.',
      'The city also hosts forums that exist because of what Mumbai is: the Securities Appellate Tribunal, a busy NCLT bench, the Debt Recovery Tribunal and MahaRERA. A Mumbai lawyer usually assesses first whether your matter belongs before one of these rather than in ordinary civil court, because the answer changes everything that follows.',
    ],
    focus: [
      { title: 'Redevelopment and society disputes', text: 'Society conveyance, redevelopment agreements and disputes between members and developers — the defining property litigation of this city.' },
      { title: 'Tenancy under the Rent Act', text: 'Protected tenancies in older buildings, where eviction is possible only on statutory grounds.' },
      { title: 'Commercial and securities', text: 'Contract disputes, arbitration, and matters before SEBI and the Securities Appellate Tribunal.' },
      { title: 'Insolvency and recovery', text: 'The Mumbai NCLT bench and the DRT carry heavy lists of company and bank-recovery matters.' },
    ],
    faqs: [
      { q: 'Do I file in the Bombay High Court or a lower court?', a: 'The High Court has original civil jurisdiction over Greater Mumbai for suits above the prescribed value; below that the City Civil Court hears them. Your lawyer values the claim first, because filing in the wrong forum costs months.' },
      { q: 'My society redevelopment has stalled. Where do I go?', a: 'Depending on the stage it may be MahaRERA, the Co-operative Court, or a civil suit for specific performance of the development agreement. Redevelopment disputes frequently involve more than one forum at once, which is why they need early advice.' },
    ],
  },

  bengaluru: {
    intro: [
      'Bengaluru is the seat of the Karnataka High Court, with additional benches at Dharwad and Kalaburagi for the north of the state. The city\'s district judiciary works out of the City Civil Court complex, with commercial courts designated to hear high-value business disputes.',
      'What sets Bengaluru apart is the volume of technology-sector litigation — shareholder disputes, ESOP claims, employment terminations and intellectual-property matters — running alongside one of the country\'s heaviest loads of land-title litigation, a legacy of how quickly the city absorbed the villages around it.',
    ],
    focus: [
      { title: 'Land title and khata disputes', text: 'Revenue-site conversions, B-khata property, and title chains broken when agricultural land became layouts.' },
      { title: 'Technology-sector employment', text: 'Termination, notice pay, moonlighting and non-solicitation disputes from the IT corridors.' },
      { title: 'Start-up and shareholder matters', text: 'Founder disputes, investment-agreement breaches and oppression petitions before the NCLT bench here.' },
      { title: 'Apartment and association disputes', text: 'Maintenance, common-area and builder-handover disputes under the Karnataka Apartment Ownership Act.' },
    ],
    faqs: [
      { q: 'Is B-khata property safe to buy in Bengaluru?', a: 'B-khata records that a property exists on the municipal register but does not certify that it complies with plan approvals, which limits loans and regularisation. It is not automatically illegal, but it needs a careful title check by a property lawyer before any payment.' },
      { q: 'Can my employer enforce a notice period after I resign?', a: 'The contract governs, and courts usually allow recovery of pay in lieu of notice, but they will not force a person to keep working. Clauses restraining you from joining a competitor afterwards generally fail under Section 27 of the Contract Act.' },
    ],
  },

  hyderabad: {
    intro: [
      'Hyderabad is the seat of the Telangana High Court, which became a separate court in 2019 when the common High Court for the two Telugu states was divided. The city\'s district judiciary sits at the City Civil Court complex, with the Metropolitan Sessions Court and commercial courts alongside.',
      'Two things shape Hyderabad\'s litigation more than anything else: land and technology. Legacy title problems from the erstwhile Hyderabad State, endowment and wakf properties, and rapid development along the western corridor generate a heavy property list — while HITEC City generates the employment and commercial work of a modern IT hub.',
    ],
    focus: [
      { title: 'Land title and government land', text: 'Disputes over assigned land, endowment and wakf property, and record corrections under the Telangana revenue system.' },
      { title: 'IT-sector employment', text: 'Termination, notice-period and confidentiality disputes from the HITEC City and Gachibowli corridor.' },
      { title: 'Real estate and RERA', text: 'Delayed projects, plot sales and builder agreements taken to TS RERA or the consumer commission.' },
      { title: 'Family and succession', text: 'Matrimonial, maintenance and inheritance matters, including those governed by personal law.' },
    ],
    faqs: [
      { q: 'Does the Telangana High Court hear Andhra Pradesh matters?', a: 'No. Since the 2019 bifurcation, Telangana matters are heard in Hyderabad and Andhra Pradesh matters by the Andhra Pradesh High Court at Amaravati. Cases pending at the time were divided between the two.' },
      { q: 'How do I check whether land in Hyderabad is assigned or government land?', a: 'By examining the revenue records, the prohibited-property list maintained under Section 22A of the Registration Act, and the title chain. Assigned land carries restrictions on transfer, and a sale in breach of them can be set aside.' },
    ],
  },

  chennai: {
    intro: [
      'Chennai is the seat of the Madras High Court, one of the three chartered High Courts established in 1862, and it retains original civil jurisdiction over the city — suits above a threshold are filed in the High Court itself. A separate bench sits at Madurai for the southern districts.',
      'The port, the automotive belt to the south and a large IT corridor give the city a broad commercial practice. Alongside it runs substantial admiralty work: the Madras High Court has admiralty jurisdiction, so ship arrest and maritime claims are argued here.',
    ],
    focus: [
      { title: 'Property title and patta disputes', text: 'Title verification, patta transfer and encroachment matters, including on land absorbed by the city\'s expansion.' },
      { title: 'Admiralty and shipping', text: 'Cargo claims, ship arrest and charterparty disputes arising from the port.' },
      { title: 'Employment and IT-sector', text: 'Termination and contract disputes from the OMR corridor and the manufacturing belt at Sriperumbudur.' },
      { title: 'Consumer and construction', text: 'Flat purchase, delayed possession and service-deficiency complaints before TN RERA and the consumer commissions.' },
    ],
    faqs: [
      { q: 'What is patta and why does it matter?', a: 'Patta is the revenue record showing who holds a piece of land. It is not by itself proof of title, but a mismatch between the patta and the sale deed is one of the commonest sources of property litigation in Tamil Nadu, so it is checked before every purchase.' },
      { q: 'Can I sue a shipping company in Chennai?', a: 'Yes, where the claim falls within admiralty jurisdiction — cargo damage, freight, or a maritime lien. The High Court can order the arrest of a vessel in Indian waters as security, which is why such claims are brought here.' },
    ],
  },

  kolkata: {
    intro: [
      'Kolkata is the seat of the Calcutta High Court, the oldest High Court in India, established in 1862 and still exercising original civil jurisdiction over the city. It has a circuit bench at Jalpaiguri, and its jurisdiction extends to the Andaman and Nicobar Islands.',
      'The city\'s district judiciary sits at Bankshall and Alipore. Kolkata\'s legal work is marked by the age of its property — thika tenancies, premises under the West Bengal Premises Tenancy Act, and title chains going back generations — alongside commercial disputes from the port and the eastern industrial belt.',
    ],
    focus: [
      { title: 'Tenancy and eviction', text: 'Long-standing tenancies under the West Bengal Premises Tenancy Act, where eviction requires statutory grounds.' },
      { title: 'Old property and title chains', text: 'Partition and title suits over properties held jointly for generations.' },
      { title: 'Commercial and port disputes', text: 'Contract, freight and recovery matters arising from the port and eastern trade.' },
      { title: 'Company and insolvency', text: 'Matters before the Kolkata NCLT bench and the company jurisdiction of the High Court.' },
    ],
    faqs: [
      { q: 'What is a thika tenancy?', a: 'A distinctive Kolkata arrangement where the tenant holds the land and owns the structure on it, governed by its own legislation rather than ordinary landlord-tenant law. Disputes go before the Thika Controller, and the rules differ substantially from a normal tenancy.' },
      { q: 'Can my landlord in Kolkata increase the rent freely?', a: 'For premises covered by the West Bengal Premises Tenancy Act, increases are regulated and eviction is possible only on grounds the Act allows — default, subletting, or the landlord\'s reasonable requirement. Newer tenancies outside the Act follow the agreement.' },
    ],
  },

  pune: {
    intro: [
      'Pune matters are heard by the District and Sessions Court at Shivajinagar — one of the largest district judiciaries in Maharashtra — with appeals and writ petitions going to the Bombay High Court in Mumbai. There is no High Court bench in Pune.',
      'The city\'s disputes track its two economies. The IT and automotive belt along Hinjawadi, Chakan and Talegaon generates employment, contract and industrial matters, while the older city and the fast-growing suburbs generate a steady flow of property, society and family litigation.',
    ],
    focus: [
      { title: 'Flat purchase and builder disputes', text: 'Delayed possession, area shortfall and agreement breaches, taken to MahaRERA or the consumer commission.' },
      { title: 'Employment and IT-sector contracts', text: 'Termination, notice-period and non-compete disputes from the Hinjawadi and Kharadi corridors.' },
      { title: 'Land and revenue matters', text: 'Agricultural land converted for development around Pune, with title and 7/12 record questions.' },
      { title: 'Family and matrimonial', text: 'The Pune Family Court handles divorce, maintenance and custody for the district.' },
    ],
    faqs: [
      { q: 'Should a flat-possession delay go to RERA or consumer court?', a: 'Both are open in many cases. MahaRERA is usually faster for possession and interest on delay; the consumer commission suits claims framed as deficiency in service with compensation. A lawyer picks based on what you actually want.' },
      { q: 'Where is a Pune case appealed?', a: 'To the District Court for appeals from lower civil courts, and then to the Bombay High Court in Mumbai. Maharashtra\'s High Court benches sit at Nagpur and Aurangabad, neither of which covers Pune.' },
    ],
  },

  ahmedabad: {
    intro: [
      'Ahmedabad is the seat of the Gujarat High Court, which serves the entire state — Gujarat has no separate High Court benches, so appellate work from every district converges here. The city\'s district judiciary sits at the City Civil and Sessions Court, with designated commercial courts.',
      'Gujarat\'s commercial character shapes the practice: contract and recovery work, company matters before the Ahmedabad NCLT bench, and a heavy load of property and development litigation as the city expands westward.',
    ],
    focus: [
      { title: 'Commercial contracts and recovery', text: 'Trade disputes, arbitration and recovery suits from one of India\'s most business-dense cities.' },
      { title: 'Land development and title', text: 'Non-agricultural conversion, town-planning schemes and title disputes as the city expands.' },
      { title: 'Company and insolvency', text: 'Matters before the NCLT bench at Ahmedabad, covering companies across Gujarat.' },
      { title: 'Consumer and RERA', text: 'Builder delay, possession and quality complaints before Gujarat RERA and the consumer commissions.' },
    ],
    faqs: [
      { q: 'Does the Gujarat High Court have benches in other cities?', a: 'No. It sits only at Ahmedabad, so appeals and writ petitions from every district in Gujarat — Surat, Vadodara, Rajkot and the rest — are filed here.' },
      { q: 'What is NA permission?', a: 'Permission to use agricultural land for a non-agricultural purpose, granted by the Collector. Building on agricultural land without it creates title and approval problems, and buyers are advised to see the NA order before purchase.' },
    ],
  },

  jaipur: {
    intro: [
      'Jaipur has a permanent bench of the Rajasthan High Court, whose principal seat is at Jodhpur. Both are the same court, and which one hears a matter depends on the district it comes from — the Jaipur bench covers the eastern districts, including the capital itself.',
      'As the state capital, Jaipur carries the bulk of Rajasthan\'s administrative litigation: service matters, writ petitions against state departments, and disputes over allotments by the development authority. Tourism, gems and handicraft trade add a commercial layer on top.',
    ],
    focus: [
      { title: 'JDA allotment and land disputes', text: 'Development authority allotments, regularisation and lease-deed disputes across the city.' },
      { title: 'State government service matters', text: 'Promotion, seniority and pension disputes taken to the High Court bench or the state tribunal.' },
      { title: 'Gems and handicraft trade', text: 'Payment, consignment and export disputes from Jaipur\'s stone and craft trade.' },
      { title: 'Property and family', text: 'Partition, succession and matrimonial matters before the district and family courts.' },
    ],
    faqs: [
      { q: 'Should I file in Jaipur or Jodhpur?', a: 'It follows the district your matter arises from. The Jaipur bench covers the eastern districts of Rajasthan and the principal seat at Jodhpur covers the west. A matter filed at the wrong seat is returned, so the district decides it, not convenience.' },
      { q: 'Is the Jaipur bench lower than the Jodhpur seat?', a: 'No. Both are the Rajasthan High Court with the same powers. An order from Jaipur is not appealed to Jodhpur — a further appeal lies to a division bench or to the Supreme Court.' },
    ],
  },

  lucknow: {
    intro: [
      'Lucknow has a permanent bench of the Allahabad High Court, established under the Amalgamation Order of 1948, serving the districts of Awadh assigned to it. The principal seat is at Prayagraj. Below the bench sits the District and Sessions Court for the capital.',
      'Being the seat of the state government, Lucknow carries an unusually heavy load of service and administrative litigation. The UP Public Services Tribunal sits here, and writ petitions against state departments form a large part of what the bench hears.',
    ],
    focus: [
      { title: 'State service matters', text: 'Promotions, seniority, pensions and departmental proceedings before the tribunal and the High Court bench.' },
      { title: 'Land acquisition and development authority', text: 'Compensation and allotment disputes involving the LDA and state acquisition.' },
      { title: 'Education and recruitment', text: 'Challenges to selections, results and appointments in state services and universities.' },
      { title: 'Property and tenancy', text: 'Old city properties, tenancy under UP rent legislation, and partition matters.' },
    ],
    faqs: [
      { q: 'Which districts does the Lucknow bench cover?', a: 'The Awadh region districts assigned to it, including Lucknow, Barabanki, Sitapur, Hardoi, Unnao, Rae Bareli and Sultanpur. Other districts go to the principal seat at Prayagraj.' },
      { q: 'Where do state employees take service disputes?', a: 'To the UP Public Services Tribunal in most cases, with a writ petition to the High Court against its order. Going straight to the High Court is usually met with the objection that the tribunal should have been approached first.' },
    ],
  },

  chandigarh: {
    intro: [
      'Chandigarh is the seat of the Punjab and Haryana High Court, a single High Court serving two states and this union territory. The city has its own District Court complex in Sector 43, so the High Court and the district judiciary sit minutes apart — unusual anywhere else in India.',
      'As a planned city held by a UT administration, Chandigarh\'s property law is distinctive. Land is largely held on lease or allotment from the Estate Office rather than freehold, and building violations, misuse of premises and conversion questions form a substantial part of the local practice.',
    ],
    focus: [
      { title: 'Estate Office and allotment matters', text: 'Leasehold property, resumption notices, misuse and conversion to freehold.' },
      { title: 'Building violation and sealing', text: 'Notices for deviation from the sanctioned plan and the appeals against them.' },
      { title: 'Service matters from two states', text: 'Punjab, Haryana and UT service disputes argued before the High Court here.' },
      { title: 'Family and matrimonial', text: 'Divorce, maintenance and custody matters before the district and family courts.' },
    ],
    faqs: [
      { q: 'Why does one High Court serve Punjab, Haryana and Chandigarh?', a: 'When Punjab was reorganised in 1966, the existing High Court was made common to the successor states and the union territory. It has remained a single court since, sitting at Chandigarh.' },
      { q: 'What is a resumption notice?', a: 'A notice from the Estate Office proposing to take back a leasehold property for breach of the allotment conditions — unpaid instalments, misuse, or unauthorised construction. It can be contested through the departmental appeals and then by writ petition.' },
    ],
  },

  patna: {
    intro: [
      'Patna is the seat of the Patna High Court, established in 1916 and serving the whole of Bihar — the state has no separate High Court benches, so appellate work from every district comes here. The city also has its own District and Sessions Court.',
      'Land is the defining subject of Bihar litigation. Survey and settlement records, bataidari and tenancy questions, and title chains complicated by decades of informal transfers make property suits the largest single category before these courts.',
    ],
    focus: [
      { title: 'Land title and survey records', text: 'Disputes over settlement records, jamabandi entries and mutation of holdings.' },
      { title: 'Partition and family property', text: 'Division of joint family land across generations, often never formally partitioned.' },
      { title: 'Service and administrative matters', text: 'State service, recruitment and departmental disputes before the High Court.' },
      { title: 'Criminal trials and bail', text: 'Sessions matters and bail applications from across the state reaching the High Court.' },
    ],
    faqs: [
      { q: 'Are there High Court benches elsewhere in Bihar?', a: 'No. The Patna High Court sits only at Patna, so appeals and writ petitions from every district in the state are filed here.' },
      { q: 'What is jamabandi and why does it matter?', a: 'It is the revenue register recording who holds a piece of land and pays rent on it. A jamabandi entry is not conclusive proof of title, but a mismatch between it and the deed is where most Bihar land disputes begin.' },
    ],
  },
};

/**
 * The written content for a city, or null if none exists yet. Slugs are the
 * same ones the URLs use, so `/karaikal` looks up `karaikal`.
 */
export function getCityContent(slug) {
  return CITY_CONTENT[String(slug || '').toLowerCase()] || null;
}

/** The High Court with jurisdiction over a state or UT, or null. */
export function getHighCourt(state) {
  return HIGH_COURTS[state] || null;
}
