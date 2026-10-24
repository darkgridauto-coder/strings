import { LegalDoc } from '@/components/legal/LegalDoc';

export default function Page() {
  return (
    <LegalDoc
      title="Community guidelines"
      intro="Strings is built on transparency and respect. These guidelines describe what is welcome, what is not, and what happens when someone crosses the line. This is a working draft, not final policy."
      sections={[
        {
          heading: 'Our principles',
          paragraphs: [
            '• Be honest about who you are and what you share',
            '• Treat people with dignity, even when you disagree',
            '• Protect your own privacy and other people\u2019s',
            '• Help us keep Strings safe by reporting problems',
          ],
        },
        {
          heading: 'Respect and safety',
          paragraphs: [
            'Strings is for conversation, not intimidation. Disagree with ideas, not with people\u2019s worth. Do not encourage others to harm themselves or anyone else.',
          ],
        },
        {
          heading: 'Harassment and hate',
          paragraphs: [
            'We do not allow targeted harassment, bullying, repeated unwanted contact, or content that attacks people for their race, ethnicity, nationality, religion, gender, sexual orientation, disability, or similar characteristics.',
          ],
        },
        {
          heading: 'Violence and threats',
          paragraphs: [
            'Do not threaten violence, glorify attacks, or coordinate harm. Credible threats may be reported to the authorities.',
          ],
        },
        {
          heading: 'Impersonation and spam',
          paragraphs: [
            '• Do not pretend to be another person, brand, or official account',
            '• Do not post repetitive, misleading, or unsolicited promotional content',
            '• Do not run fake engagement, bulk accounts, or automated activity without approval',
          ],
        },
        {
          heading: 'Privacy and consent',
          paragraphs: [
            'Do not share private information about others \u2014 addresses, phone numbers, identity documents, financial details, or private messages \u2014 without their clear consent. Do not post intimate images of anyone without permission.',
          ],
        },
        {
          heading: 'Harmful and illegal content',
          paragraphs: [
            'Content that sexually exploits or endangers children is prohibited and will be reported. We also remove content that promotes self-harm, sells illegal goods, enables fraud or malware, or spreads dangerous misinformation. If you or someone you know is in crisis, please contact local emergency services.',
          ],
        },
        {
          heading: 'Messaging etiquette',
          paragraphs: [
            'Respect when someone does not reply or asks you to stop. Use block and restrict if you need space. Do not forward private conversations to shame or expose people.',
          ],
        },
        {
          heading: 'Reporting',
          paragraphs: [
            'Tap the menu on any post or profile and choose Report, then select a reason. Reports go to authorised moderators and are reviewed against these guidelines. You will not be told who reported you.',
          ],
        },
        {
          heading: 'Enforcement',
          paragraphs: [
            'Depending on severity and history we may remove content, add a warning, limit features such as posting or messaging, temporarily suspend an account, or permanently remove it. Illegal or very serious harm can lead to immediate removal.',
          ],
        },
        {
          heading: 'Appeals',
          paragraphs: [
            'If you think we made a mistake, you can ask for a review through the Help center. A different moderator will look at your case and the outcome is recorded in the audit log.',
          ],
        },
      ]}
    />
  );
}
