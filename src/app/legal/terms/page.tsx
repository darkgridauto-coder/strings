import { LegalDoc } from '@/components/legal/LegalDoc';

export default function Page() {
  return (
    <LegalDoc
      title="Terms of service"
      intro="These Terms set out the rules for using Strings. They are written to be clear, fair, and easy to find again later. This is a working draft, not final legal text."
      sections={[
        {
          heading: 'Acceptance of these Terms',
          paragraphs: [
            'By creating an account or using Strings, you agree to these Terms, our Privacy Policy, and our Community Guidelines.',
            'If you do not agree, please do not use the service. If you use Strings for an organisation, you confirm you may accept these Terms on its behalf.',
          ],
        },
        {
          heading: 'Who can use Strings',
          paragraphs: [
            'You must be at least 13 years old, or the minimum age in your country. Where the law requires, a parent or guardian must consent for you.',
            'You must not use Strings if you were previously removed for serious violations or if the law prohibits you from using it.',
          ],
        },
        {
          heading: 'Your account',
          paragraphs: [
            'You are responsible for activity on your account and for keeping your password and recovery details secure.',
            '• Give accurate information when you register',
            '• Keep one personal account unless we approve more',
            '• Tell us quickly if you suspect unauthorised access',
            '• Never sell, rent, or transfer your account or username',
          ],
        },
        {
          heading: 'Your content and licence',
          paragraphs: [
            'You own what you post. You give Strings a worldwide, non-exclusive, royalty-free licence to host, store, display, reproduce, and distribute your content only to run, secure, and improve the service.',
            'The licence ends when you delete the content or your account, except where others have shared it or we must keep a copy for legal, safety, or backup reasons for a limited time.',
          ],
        },
        {
          heading: 'Acceptable use',
          paragraphs: [
            'You agree not to:',
            '• Harass, threaten, impersonate, or deceive others',
            '• Post unlawful, hateful, sexually exploitative, or violent content',
            '• Spam, scrape, or send unsolicited bulk messages',
            '• Probe, disrupt, or bypass security measures or rate limits',
            '• Infringe anyone\u2019s intellectual property or privacy',
          ],
        },
        {
          heading: 'Messages, calls, and status',
          paragraphs: [
            'Private messages, voice notes, calls, and status updates are for the people you choose. You are responsible for what you send and for respecting the privacy of others.',
            'Status updates disappear after 24 hours but may be retained briefly for safety and legal reasons. Recipients can still copy or screenshot what you share.',
          ],
        },
        {
          heading: 'Reporting and moderation',
          paragraphs: [
            'Anyone can report content or accounts. Authorised moderators review reports against our Guidelines and may remove content, limit features, or suspend accounts. Where practical, we tell you what happened and how to appeal.',
          ],
        },
        {
          heading: 'Intellectual property',
          paragraphs: [
            'The Strings name, logo, design, and software belong to us or our licensors. These Terms give you no right to use them except to use the service.',
          ],
        },
        {
          heading: 'Availability and changes',
          paragraphs: [
            'We work to keep Strings reliable but cannot promise uninterrupted service. We may update, suspend, or retire features and will give reasonable notice of significant changes where we can.',
          ],
        },
        {
          heading: 'Disclaimers and liability',
          paragraphs: [
            'Strings is provided "as is" and "as available". To the fullest extent the law allows, we disclaim implied warranties and are not liable for indirect or consequential losses or for content posted by users. Nothing here limits liability that cannot lawfully be limited.',
          ],
        },
        {
          heading: 'Suspension and termination',
          paragraphs: [
            'You can delete your account at any time from Settings. We may suspend or end access if you seriously or repeatedly breach these Terms, if the law requires it, or to protect users.',
          ],
        },
        {
          heading: 'Governing law and contact',
          paragraphs: [
            'These Terms are governed by the laws of the Federal Republic of Nigeria unless your local consumer law says otherwise. Please contact us first so we can try to settle any dispute informally.',
          ],
        },
      ]}
    />
  );
}
