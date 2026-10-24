export type HelpQA = { q: string; a: string };
export type HelpTopic = { title: string; icon: string; blurb: string; items: HelpQA[] };

export const HELP_TOPICS: HelpTopic[] = [
  {
    title: 'Getting started',
    icon: 'help',
    blurb: 'Create an account and find your way around',
    items: [
      { q: 'How do I create an account?', a: 'Choose Create account on the welcome screen, enter your display name, a unique username, your email and a password of at least 8 characters. Accept the Terms and Privacy Policy, then verify with the 6-digit code.' },
      { q: 'What is the Home feed?', a: 'Home shows posts from your community, most recent first. Switch between For you and Following using the control at the top.' },
      { q: 'How do I find people to follow?', a: 'Open Explore to see suggested people and trending topics, or use Search to look up names, usernames and #topics.' },
      { q: 'What do the tabs do?', a: 'Home is your feed, Explore helps you discover, the centre button creates a post, Messages holds chats and calls, and Profile is your page. On desktop these live in the left sidebar.' },
    ],
  },
  {
    title: 'Account & sign-in',
    icon: 'user',
    blurb: 'Registration, verification and recovery',
    items: [
      { q: 'How do I recover my account?', a: 'Choose Forgot login details on the sign-in screen and enter your email. We show the same message whether or not an account exists, to protect your privacy.' },
      { q: 'Why do I need to verify my account?', a: 'Verification confirms you control your contact method and helps keep fake and spam accounts out.' },
      { q: 'I did not receive my code. What now?', a: 'Wait up to a minute, check you typed the contact detail correctly, then tap Resend code. Codes can be requested again after a short countdown.' },
      { q: 'How do I change my password?', a: 'Go to Settings → Password & security → Change password. Choose at least 8 characters and avoid reusing passwords from other sites.' },
    ],
  },
  {
    title: 'Profile & username',
    icon: 'user',
    blurb: 'Make your page yours',
    items: [
      { q: 'How do I edit my profile?', a: 'Open Profile and tap Edit profile to change your name, bio, photo and cover image.' },
      { q: 'What are the username rules?', a: 'Usernames are 3–20 characters using lowercase letters, numbers and underscores. A username already in use cannot be taken.' },
      { q: 'Can I remove my photo or cover?', a: 'Yes. In Edit profile, choose Remove next to the photo or cover.' },
      { q: 'Who can see my profile?', a: 'That depends on Settings → Privacy → Profile visibility: Public, Followers only, or Private. Blocked accounts never see your profile.' },
    ],
  },
  {
    title: 'Posts & media',
    icon: 'img',
    blurb: 'Publishing and managing content',
    items: [
      { q: 'How do I create a post?', a: 'Tap the Create button, write up to 500 characters, optionally attach an image, then tap Publish.' },
      { q: 'What media can I attach?', a: 'PNG, JPG, GIF or WebP files up to 5 MB.' },
      { q: 'How do hashtags work?', a: 'Any word starting with # becomes a link to a topic page that lists matching posts.' },
      { q: 'How do comments and replies work?', a: 'Open a post, write a comment, or tap Reply on an existing comment to answer it directly.' },
    ],
  },
  {
    title: 'Messaging & voice notes',
    icon: 'chat',
    blurb: 'Chats, groups and recordings',
    items: [
      { q: 'How do I start a chat?', a: 'Open Messages and tap the compose icon. Pick a person, or choose New group, name it and select at least two people.' },
      { q: 'How do voice notes work?', a: 'In a chat, tap the microphone, allow access when asked, record, then send or cancel. Tap a voice note to play it.' },
      { q: 'Are my messages encrypted?', a: 'Strings is designed for end-to-end encryption, but the protocol is not implemented yet. Messages are protected in transit and at rest but the server can read them. See Safety and encryption in each conversation.' },
      { q: 'What are message requests?', a: 'Messages from people you do not follow arrive in Requests. Nothing continues until you tap Accept. If you message someone who does not follow you, your message becomes a request to them.' },
      { q: 'How do I mute or leave a conversation?', a: 'Open the conversation menu, then turn on Mute notifications, or choose Leave group for groups.' },
    ],
  },
  {
    title: 'Calls & status',
    icon: 'phone',
    blurb: 'Voice, video and 24-hour updates',
    items: [
      { q: 'How do I make a call?', a: 'Open a conversation and tap the phone or video icon. Calls are powered by LiveKit; if the calling service is not configured you will see an explanatory message instead of connecting.' },
      { q: 'Why is my camera not working?', a: 'Check that you allowed camera access in your browser or device settings, and that no other app is using the camera.' },
      { q: 'What is a status?', a: 'A status is a text or photo update that disappears after 24 hours. Tap Your status at the top of Home to add one.' },
      { q: 'Who sees my status?', a: 'Status updates in the current build are stored on your device only. When server storage is added, they will be visible to your followers.' },
    ],
  },
  {
    title: 'Privacy & safety',
    icon: 'shield',
    blurb: 'Control who sees and contacts you',
    items: [
      { q: 'How do I block someone?', a: 'Open their profile, tap the three dots and choose Block. They are removed from your feed, search and messages.' },
      { q: 'How do I report content?', a: 'Tap the three dots on a post or profile, choose Report, and pick a reason. Moderators review every report.' },
      { q: 'How do hidden words work?', a: 'Add words in Settings → Privacy → Hidden words. Content containing them is filtered from your experience.' },
      { q: 'Can I limit who messages me?', a: 'Yes. Settings → Privacy → Messaging permissions lets you choose Everyone, People I follow, or No one.' },
    ],
  },
  {
    title: 'Notifications',
    icon: 'bell',
    blurb: 'Alerts, channels and quiet hours',
    items: [
      { q: 'How do I change what I am notified about?', a: 'Settings → Notifications lets you toggle followers, reactions, mentions, and messages separately.' },
      { q: 'What are quiet hours?', a: 'A schedule that silences eligible alerts, for example 22:00 to 07:00 on weekdays. Messages still arrive and in-app activity is kept.' },
      { q: 'Why am I not getting push alerts?', a: 'Check that Push notifications is on in Settings and that your device allows notifications for Strings.' },
    ],
  },
  {
    title: 'Settings & accessibility',
    icon: 'gear',
    blurb: 'Appearance, language and readability',
    items: [
      { q: 'How do I switch to dark mode?', a: 'Settings → Appearance. Choose Light, Dark, or OLED, or follow your device setting.' },
      { q: 'How do I make text larger?', a: 'Use the text size slider in Appearance. It scales text across the app.' },
      { q: 'What accessibility options exist?', a: 'Higher contrast, reduced motion, and clearer keyboard focus, all in Settings → Accessibility.' },
      { q: 'How do I change time zone or region?', a: 'Settings → Time zone and Region. They are separate: one sets the clock, the other sets date and number formats.' },
    ],
  },
];
