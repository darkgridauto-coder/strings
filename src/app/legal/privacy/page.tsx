import { LegalDoc } from '@/components/legal/LegalDoc';

export default function Page() {
  return (
    <LegalDoc
      title="Privacy policy"
      intro="Your privacy matters. This policy explains what Strings collects, why we collect it, who can see it, and the choices you have. This is a working draft, not final legal text."
      sections={[
        {
          heading: 'Overview',
          paragraphs: [
            'Strings is a place to connect, share, and communicate. We collect only what we need to run the service, keep it safe, and improve it. We do not sell your personal information.',
            'This policy applies to the Strings apps and website. By using Strings, you acknowledge the practices described here.',
          ],
        },
        {
          heading: 'Information you give us',
          paragraphs: [
            '• Account details: display name, username, password, and email',
            '• Profile details: photo, cover image, bio, and audience preferences',
            '• Content: posts, comments, status updates, messages, and media you upload',
            '• Support: reports, help requests, and attachments you send us',
          ],
        },
        {
          heading: 'Information collected automatically',
          paragraphs: [
            '• Device and app data: device type, operating system, language, time zone, and app version',
            '• Usage data: features used, pages viewed, and timestamps of activity',
            '• Security signals: sign-in times, session information, and failed attempts',
            'We collect only what is required to operate and protect the service.',
          ],
        },
        {
          heading: 'Messages, voice notes, and calls',
          paragraphs: [
            'Private messages and voice notes are intended for their recipients. In the current build, messages are protected in transit and at rest but are not end-to-end encrypted. The Safety and encryption screen in each conversation shows the real status.',
            'Calls are protected by the underlying WebRTC transport when LiveKit is configured. Audio and video are only captured after you grant microphone and camera permission.',
          ],
        },
        {
          heading: 'How we use information',
          paragraphs: [
            '• To create and secure your account and verify your identity',
            '• To show your content to the audience you choose',
            '• To deliver notifications you have enabled',
            '• To prevent spam, fraud, abuse, and security threats',
            '• To review reports, enforce our Guidelines, and comply with law',
            '• To fix bugs and improve reliability and design',
          ],
        },
        {
          heading: 'Who can see your information',
          paragraphs: [
            'Your display name, username, photo, and public posts are visible according to your profile visibility setting. Email and date of birth are private and never shown publicly.',
            'Blocked accounts cannot view your profile, message you, or find you in search.',
          ],
        },
        {
          heading: 'Sharing and disclosure',
          paragraphs: [
            'We share information only with service providers who help us operate Strings under confidentiality obligations, with authorities when legally required, or to protect people from serious harm. We do not sell your data or share it with advertisers in a way that identifies you.',
          ],
        },
        {
          heading: 'Your controls',
          paragraphs: [
            'From Settings you can change profile visibility, who can message or mention you, hidden words, blocked and restricted accounts, notification channels, and quiet hours. Changes apply immediately.',
          ],
        },
        {
          heading: 'Retention and deletion',
          paragraphs: [
            'We keep information while your account is active. When you delete content, it is removed from view immediately and from our systems within a reasonable period, except where we must keep limited records for security, legal, or backup reasons.',
            'When you delete your account, we remove or anonymise your personal information, subject to those same limited exceptions.',
          ],
        },
        {
          heading: 'Security',
          paragraphs: [
            'We use access controls, encryption in transit, and monitoring to protect information. No system is perfectly secure, so please use a strong, unique password and keep recovery details current.',
          ],
        },
        {
          heading: 'Your rights',
          paragraphs: [
            'Depending on where you live, you may have the right to access, correct, export, or delete your information, to object to or restrict certain processing, and to withdraw consent. Contact us through the Help center to make a request.',
          ],
        },
        {
          heading: 'Children',
          paragraphs: [
            'Strings is not intended for children under 13, or the minimum age in your country. If we learn that we hold information about a child without proper consent, we will delete it.',
          ],
        },
        {
          heading: 'Changes and contact',
          paragraphs: [
            'We may update this policy and will notify you inside Strings about material changes before they apply. If you have questions, contact us through the Help center.',
          ],
        },
      ]}
    />
  );
}
