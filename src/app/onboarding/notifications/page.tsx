'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthSplit } from '@/components/auth/AuthSplit';
import { Button } from '@/components/ui/Button';
import { Row } from '@/components/ui/Row';
import { Toggle } from '@/components/ui/Toggle';
import { useUser } from '@/components/UserProvider';
import { registerPush } from '@/lib/pushClient';

export default function Page() {
  const router = useRouter();
  const { refresh } = useUser();
  const [messages, setMessages] = useState(true);
  const [social, setSocial] = useState(true);

  async function savePreferences(pushEnabled: boolean): Promise<boolean> {
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            notifMsg: messages,
            notifFol: social,
            notifRea: social,
            notifPush: pushEnabled,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) return false;

      await refresh();
      return true;
    } catch {
      return false;
    }
  }

  async function enable() {
    const saved = await savePreferences(false);
    if (!saved) {
      window.alert('Could not save your notification preferences. Please try again.');
      return;
    }

    const result = await registerPush();
    if (result.ok) {
      const pushSaved = await savePreferences(true);
      if (!pushSaved) {
        window.alert('Push was enabled in your browser, but the preference could not be saved. You can retry in Settings.');
      }
    } else {
      window.alert(`Push notifications were not enabled: ${result.error || 'Permission or setup unavailable'}. Your activity preferences have been saved.`);
    }

    router.push('/app');
  }

  async function skip() {
    const saved = await savePreferences(false);
    if (!saved) {
      window.alert('Could not save your notification preferences. Please try again.');
      return;
    }
    router.push('/app');
  }

  return (
    <AuthSplit>
      <p className="auth-brand">Step 2 of 2</p>
      <h1 style={{ marginBottom: 6 }}>Stay in the loop</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Choose how you hear about messages, activity and updates. You can change this later in Settings.
      </p>
      <div style={{ margin: '8px 0' }}>
        <Row icon="chat" title="Messages" sub="Know when someone contacts you." trail={<Toggle checked={messages} onChange={setMessages} label="Messages" />} />
        <Row icon="users" title="Social activity" sub="Receive interaction updates." trail={<Toggle checked={social} onChange={setSocial} label="Social activity" />} />
      </div>
      <Button onClick={enable} block>Enable notifications</Button>
      <p style={{ marginTop: 12, textAlign: 'center', fontSize: '.92em' }}>
        <button onClick={skip} className="muted">Not now</button>
      </p>
    </AuthSplit>
  );
}
