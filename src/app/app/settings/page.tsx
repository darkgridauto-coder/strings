import Link from 'next/link';
import { Row } from '@/components/ui/Row';
import { Card } from '@/components/ui/Card';

export default function Page() {
  return (
    <>
      <header className="topbar"><span style={{ width: 42 }} /><h1 className="left">Settings</h1><div className="topbar-actions" /></header>
      <div className="page">
        <Row icon="user" title="Your profile" sub="Name, photo, bio" href="/app/profile" showChevron />
        <Card>
          <h3 style={{ marginTop: 0 }}>Account</h3>
          <Row icon="user" title="Personal information" href="/app/settings/personal" showChevron />
          <Row icon="mail" title="Contact information" href="/app/settings/contact" showChevron />
          <Row icon="users" title="Accounts" sub="Switch between accounts on this device" href="/app/settings/accounts" showChevron />
          <Row icon="shield" title="Verification" sub="Identity, professional, organisation" href="/app/settings/verification" showChevron />
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>Security & privacy</h3>
          <Row icon="key" title="Password & security" href="/app/settings/security" showChevron />
          <Row icon="shield" title="Two-factor authentication" sub="Add a second factor to your login" href="/app/settings/security/2fa" showChevron />
          <Row icon="lock" title="Privacy" href="/app/settings/privacy" showChevron />
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>Preferences</h3>
          <Row icon="bell" title="Notifications" href="/app/settings/notifications" showChevron />
          <Row icon="eye" title="Appearance" href="/app/settings/appearance" showChevron />
          <Row icon="help" title="Accessibility" href="/app/settings/accessibility" showChevron />
          <Row icon="globe" title="Language" href="/app/settings/language" showChevron />
          <Row icon="globe" title="Region" href="/app/settings/region" showChevron />
          <Row icon="clock" title="Time zone" href="/app/settings/time-zone" showChevron />
          <Row icon="chat" title="Chats & media" href="/app/settings/chat-media" showChevron />
          <Row icon="phone" title="Call preferences" href="/app/settings/calls" showChevron />
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>Content & tools</h3>
          <Row icon="doc" title="Your posts & status" sub="Manage what you have shared" href="/app/settings/content" showChevron />
          <Row icon="crown" title="Strings Pro" sub="Power-user tools" href="/app/settings/pro" showChevron />
          <Row icon="lock" title="Secure vault" sub="Encrypted notes" href="/app/settings/pro/vault" showChevron />
          <Row icon="filter" title="Feed controls" sub="Topic weights for home feed" href="/app/settings/pro/feed" showChevron />
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>Support</h3>
          <Row icon="help" title="Help center" href="/app/help" showChevron />
          <Row icon="info" title="About Strings" href="/app/about" showChevron />
        </Card>
        <Link href="/login" className="btn btn-outline btn-block" style={{ marginTop: 16 }}>Sign out</Link>
        <p className="muted" style={{ textAlign: 'center', fontSize: '.8em', marginTop: 12 }}>
          All settings are securely saved to your account.
        </p>
      </div>
    </>
  );
}
