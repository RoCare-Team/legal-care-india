import { createMetadata } from '@/lib/metadata';
import { SITE } from '@/constants/site';
import ContentPage from '@/components/shared/ContentPage';

export const metadata = createMetadata({
  title: 'Privacy Policy',
  description: `How ${SITE.name} collects, uses, shares and protects the personal data of lawyers who enrol on the platform.`,
  path: '/privacy',
});

const PRIVACY_EMAIL = 'support@justiceland.online';
const PRIVACY_PHONE = '+91 85100 99972';

// Section 4 — purpose, examples, and the ground under the DPDP Act, 2023
// (consent, or a "legitimate use" under Section 7). Shown as a list rather
// than a table so it stays readable at phone width.
const PURPOSES = [
  ['Creating and managing your account', 'Registration, login, authentication, account support', 'Your consent'],
  ['Verifying your credentials', 'Checking enrolment and good standing, preventing impersonation', 'Your consent; compliance with law'],
  ['Listing you in the directory', 'Displaying your profile in directory search results, passing Client requests to you', 'Your consent'],
  ['Facilitating communication', 'Passing Client inquiries to you, enabling calls and messaging, scheduling consultations', 'Your consent'],
  ['Payments and invoicing', 'Subscription fees, refunds, tax records', 'Your consent; compliance with law'],
  ['Improving Justice Land', 'Analytics, fixing bugs, testing features', 'Your consent'],
  ['Safety, fraud prevention and security', 'Detecting fake profiles, misuse, unauthorized access', 'Your consent; compliance with law'],
  ['Service updates', 'Product news and newsletters (you can opt out at any time)', 'Your consent'],
  ['Legal compliance', 'Responding to lawful requests, maintaining records required by law', 'Legitimate use under Section 7 of the DPDP Act (compliance with law, a judgment or an order)'],
];

// Section 9 — data and how long it is kept.
const RETENTION = [
  ['Account and profile data', 'Until you delete your account'],
  ['Verification documents', 'Until verification is complete and 3 years afterwards, or as required by law'],
  ['Payment and tax records', '3 years, or as required by tax and accounting law'],
  ['Client inquiry and communication records', '3 years'],
  ['Support records', '3 years'],
  ['Logs and security records', '3 years'],
];

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="What we collect, why, who can see it, how long we keep it and your rights."
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}
      updated="2 November 2026"
    >
      <h2>1. Introduction</h2>
      <p>
        Justice Land (&quot;we&quot; and &quot;us&quot;) respects your privacy and is committed to
        handling your personal data responsibly. This Privacy Notice explains what personal
        information we collect when you use the Justice Land website and mobile app, why we collect
        it, how we use and protect it, who can see it, how long we keep it, and what rights and
        choices you have.
      </p>
      <p>
        Justice Land is a real-time talk platform that provides legal assistance through direct
        interaction with verified lawyers across India via call and chat, and also provides draft
        legal documents as needed. Please read this notice carefully before you use the portal or
        give your consent.
      </p>
      <p>
        This notice is given under the Digital Personal Data Protection Act, 2023 (the &quot;DPDP
        Act&quot;) and the rules made under it. For the personal data described here, Justice Land is
        the <strong>Data Fiduciary</strong> and you are the <strong>Data Principal</strong>. You can
        ask us for this notice in English or in any language listed in the Eighth Schedule to the
        Constitution of India.
      </p>
      <p>
        Justice Land is an online directory of advocates. It does not rank, badge or endorse any
        advocate, does not make promises about the outcome of any matter, and does not run offers or
        discounts on legal services.
      </p>

      <h2>2. Who This Notice Applies To</h2>
      <p>This notice applies to every individual who enrols, or begins to enrol, on Justice Land as a lawyer. That includes:</p>
      <ul>
        <li>
          Advocates, attorneys and other legal practitioners licensed to practise in India, whether
          they practise alone or through a law firm, chambers or legal aid organization.
        </li>
        <li>
          Staff or representatives (for example, firm administrators, clerks or marketing personnel)
          who create or manage a profile on a lawyer&apos;s behalf, in respect of their own data as
          well as the lawyer&apos;s.
        </li>
      </ul>
      <p>
        It covers personal data we collect through the Justice Land website{' '}
        <a href="https://www.justiceland.online/">https://www.justiceland.online/</a>, our mobile
        apps, emails, phone calls and any other channel connected with your enrolment, whether online
        or offline.
      </p>

      <h2>3. Information We Collect</h2>
      <ul>
        <li><strong>Identity and contact details:</strong> full name, photograph, email address, phone number, office address, city and state, preferred language(s).</li>
        <li><strong>Professional credentials:</strong> Bar Council/bar association enrolment number, state bar of registration, year of enrolment, court(s) of practice, copies of your enrolment certificate and certificate of practice or equivalent, and identity proof used to verify you.</li>
        <li><strong>Professional profile:</strong> practice areas, years of experience, education, languages, firm name, awards, publications, areas of specialization, consultation fees, availability, and a short biography.</li>
        <li><strong>Account details:</strong> username, password (stored in encrypted form), security questions, and notification preferences.</li>
        <li><strong>Payment and billing details:</strong> billing name, GST or tax number (if applicable), and payment information processed by our payment partners. We do not store full card numbers.</li>
        <li><strong>Communications:</strong> messages you send to us, to Clients through the platform, support requests, reviews and feedback.</li>
      </ul>

      <h3>3.1 Information we collect automatically</h3>
      <ul>
        <li><strong>Device and usage data:</strong> IP address, browser type, device identifiers, operating system, pages viewed, time spent, referring pages, and actions taken on the platform.</li>
        <li><strong>Cookies and tracking:</strong> see Section 10.</li>
        <li><strong>Approximate location:</strong> derived from your IP address or, with your permission, your device, to show you relevant matters and to show Clients nearby Lawyers.</li>
      </ul>

      <h3>3.2 Information we collect from other sources</h3>
      <ul>
        <li><strong>Verification sources:</strong> Bar Councils, court records, and other public registers, to confirm your enrolment and good standing.</li>
        <li><strong>Clients:</strong> where a Client contacts or reviews you, we receive the details they provide about the inquiry and their feedback about you.</li>
        <li><strong>Public sources:</strong> professional information you have made public, such as your firm website or professional directories, used to check or enrich your profile.</li>
      </ul>
      <p>
        We do not intentionally collect sensitive categories of personal data beyond what is needed
        to verify your professional identity. If you provide any, such as disciplinary history or
        health information, you do so voluntarily, and we will treat it with additional care.
      </p>

      <h2>4. How We Use Your Information and Why</h2>
      <ul>
        {PURPOSES.map(([purpose, examples, basis]) => (
          <li key={purpose}>
            <strong>{purpose}:</strong> {examples}. <em>Ground: {basis}.</em>
          </li>
        ))}
      </ul>
      <p>
        We do not use your personal data for purposes that are incompatible with those listed above
        without telling you and, where required, obtaining your consent.
      </p>
      <p>
        <strong>Your consent.</strong> Where we rely on consent, it is free, specific, informed,
        unconditional and unambiguous, and limited to the personal data needed for the stated
        purpose. You can withdraw it at any time, as easily as you gave it, from your account
        settings or by contacting us (Section 15). You may also give, manage or withdraw consent
        through a Consent Manager registered with the Data Protection Board of India. After you
        withdraw consent, we stop processing the data for that purpose within a reasonable time,
        unless the law requires us to keep it.
      </p>

      <h2>5. What Clients Can See</h2>
      <p>
        When you enrol, the following parts of your profile are public or visible to Clients: your
        name, photograph, practice areas, location, languages, experience, firm name, biography,
        fees (if you choose to list them), and ratings or reviews. We do not show badges, rankings
        or labels that promote one advocate over another.
      </p>
      <p>
        Your enrolment certificate, identity proof, billing information, and account credentials are
        never shown to Clients.
      </p>
      <p>
        Your contact details (phone and email) are shared with a Client only when you choose to
        publish them on your profile. You can control your visibility in your account settings.
      </p>
      <p>
        Public profile information may be indexed by search engines. You can ask us to limit this,
        subject to the technical limits of search engines.
      </p>

      <h2>6. Who We Share Your Information With</h2>
      <p>We do not sell your personal data. We share it only as follows:</p>
      <ul>
        <li><strong>Clients:</strong> profile information and, where applicable, contact details, as described in Section 5.</li>
        <li><strong>Service providers (processors):</strong> companies that help us run Justice Land, such as cloud hosting, payment processing, identity verification, email and SMS delivery, analytics, customer support and security. They may process your data only on our instructions and under confidentiality and security obligations.</li>
        <li><strong>Professional bodies and verification authorities:</strong> Bar Councils or similar bodies, to verify your credentials or to respond to a complaint or inquiry.</li>
        <li><strong>Legal and regulatory authorities:</strong> courts, law enforcement, or government bodies, where we are legally required to or believe disclosure is necessary to protect rights, safety, or property.</li>
        <li><strong>Business transfers:</strong> a successor entity if Justice Land is involved in a merger, acquisition, financing, or sale of assets, subject to this notice continuing to apply or you being notified of any change.</li>
        <li><strong>With your consent:</strong> any other third party, where you have asked or agreed to it.</li>
      </ul>

      <h2>7. Client Confidentiality and Your Professional Duties</h2>
      <p>
        Justice Land is a directory and communication platform. We are not a law firm and do not
        provide legal advice or form attorney-client relationships.
      </p>
      <p>
        Please do not upload or send privileged or confidential client information through Justice
        Land unless a feature is expressly designed for that purpose. You remain solely responsible
        for complying with your professional duties of confidentiality and with the rules of your Bar
        Council or regulatory body, including rules on advertising, solicitation, and fee disclosure.
      </p>

      <h2>8. International Transfers</h2>
      <p>
        Your data may be stored or processed on servers located in India and in other countries,
        including by our service providers. Where data is transferred outside your country, we take
        steps to ensure it remains protected, in line with applicable law and any government
        restrictions on cross-border transfers.
      </p>

      <h2>9. How Long We Keep Your Information</h2>
      <ul>
        {RETENTION.map(([data, period]) => (
          <li key={data}>
            <strong>{data}:</strong> {period}.
          </li>
        ))}
      </ul>
      <p>
        When data is no longer needed, we delete or anonymize it. We may keep limited records longer
        where necessary for legal claims, fraud prevention, or to comply with the law.
      </p>

      <h2>10. Cookies and Tracking</h2>
      <p>
        We use cookies and similar technologies to keep you signed in, remember your preferences,
        secure the platform, understand how Justice Land is used, and measure our marketing. You can
        manage cookies through your browser settings. Disabling some cookies may affect how the
        platform works. We honour browser signals and legal requirements for consent to non-essential
        cookies where applicable.
      </p>

      <h2>11. How We Protect Your Information</h2>
      <p>
        We use reasonable technical and organizational safeguards, including encryption in transit,
        access controls, regular security reviews, staff confidentiality obligations, and secure
        storage of credentials. No system is completely secure. Please use a strong, unique password
        and tell us immediately if you suspect unauthorized access to your account.
      </p>
      <p>
        If a personal data breach affects you, we will inform you without delay, along with what
        happened, its likely impact and the steps you can take, and we will report it to the Data
        Protection Board of India, as the DPDP Act and its rules require.
      </p>

      <h2>12. Your Rights and Choices</h2>
      <p>Under the DPDP Act (Sections 11 to 14) and other applicable law, you may:</p>
      <ul>
        <li><strong>Access</strong> a summary of the personal data we hold about you and how it is processed.</li>
        <li><strong>Correct or update</strong> inaccurate or incomplete data. You can edit most details directly in your account.</li>
        <li><strong>Erase</strong> your data when it is no longer needed for the purpose it was collected, or when you withdraw consent, unless we must retain it by law.</li>
        <li><strong>Withdraw consent</strong> at any time. This does not affect processing already carried out, and may limit your ability to use some features.</li>
        <li><strong>Object to or restrict</strong> certain processing, such as direct marketing.</li>
        <li><strong>Data portability</strong>, where applicable, receiving your data in a commonly used format.</li>
        <li><strong>Nominate</strong> another person to exercise your rights on your behalf in the event of your death or incapacity, where the law allows.</li>
        <li>
          <strong>Grievance redressal:</strong> raise a complaint with us (see Section 15) and, if
          unresolved, with the relevant data protection authority (e.g., the Data Protection Board of
          India).
        </li>
      </ul>
      <p>
        To exercise any right, contact us using the details in Section 15. We may need to verify your
        identity before acting on your request, and we will respond within 30 days or the period
        required by law.
      </p>
      <p>
        <strong>Your duties.</strong> Under Section 15 of the DPDP Act, you must not impersonate
        another person, suppress material information or give false details (including about your
        enrolment or credentials), or file a false or frivolous grievance or complaint.
      </p>

      <h2>13. Account Closure</h2>
      <p>
        You may close your account at any time from your settings or by contacting us. After closure,
        your profile will no longer be visible to Clients. We will delete or anonymize your data in
        accordance with Section 9. Reviews or messages already exchanged with Clients may be retained
        in anonymized form or where needed to protect the other party&apos;s rights.
      </p>

      <h2>14. Children</h2>
      <p>
        Justice Land is intended for qualified legal professionals and is not directed at anyone
        under 18. We do not knowingly collect personal data from minors. If you believe a minor has
        provided data, please contact us, and we will delete it.
      </p>

      <h2>15. Contact Us and Grievance Redressal</h2>
      <p>For questions, requests, or complaints about this notice or your data:</p>
      <ul>
        <li><strong>Email:</strong> <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a></li>
        <li><strong>Phone:</strong> <a href={`tel:${PRIVACY_PHONE.replace(/\s/g, '')}`}>{PRIVACY_PHONE}</a></li>
        <li><strong>Grievance Officer (contact for questions about your personal data):</strong> Yogita Yadav, Associate</li>
        <li><strong>Registered address:</strong> Unit 831, JMD Megapolis, Sohna Road, Sector 48, Gurugram, Haryana 122018</li>
        <li><strong>Response time:</strong> we aim to acknowledge complaints within 48 hours and resolve them within 30 days.</li>
      </ul>
      <p>
        If you are not satisfied with our response, you may complain to the Data Protection Board of
        India after first using our grievance process.
      </p>

      <h2>16. Changes to This Notice</h2>
      <p>
        We may update this notice from time to time. If changes are significant, we will notify you
        by email or through the platform before they take effect and, where required, ask for fresh
        consent. The &quot;Last updated&quot; date at the top shows when this notice was last
        revised. Continued use of Justice Land after changes take effect means you accept the
        updated notice, where the law permits.
      </p>
    </ContentPage>
  );
}
