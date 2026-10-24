'use client';
import { useEffect, useState } from 'react';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { Row } from '@/components/ui/Row';
import { useUser } from '@/components/UserProvider';
import { useToast } from '@/components/ui/Toast';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export default function Page() {
  const { user, refresh } = useUser();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  async function saveEmail() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return showToast('Enter a valid email.');
    if (email === user?.email) return showToast('This is already your email.');
    
    setBusy(true);
    try {
      const r = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      
      if (d.ok) { 
        showToast('Email updated. Please verify your new address.'); 
        refresh(); 
      } else {
        showToast(d.error || 'Failed to save');
      }
    } catch { 
      showToast('Network error'); 
    } finally { 
      setBusy(false); 
    }
  }

  return (
    <SettingsShell title="Contact information" back="/app/settings">
      <p className="muted">Manage the contact methods associated with your account.</p>
      
      <div style={{ marginTop: 12 }}>
        <Row 
          icon="phone" 
          title="Phone number" 
          sub="Not added" 
          trail={<span style={{ fontSize: '.8em', color: 'var(--tx-2)' }}>Unverified</span>} 
        />
        <Row 
          icon="mail" 
          title="Email address" 
          sub={user?.email || 'Not added'} 
          trail={
            user?.email ? (
              <span style={{ fontSize: '.8em', color: (user as any).emailVerified ? 'var(--ok)' : 'var(--tx-2)' }}>
                {(user as any).emailVerified ? 'Verified' : 'Unverified'}
              </span>
            ) : null
          } 
        />
      </div>
      
      <div style={{ marginTop: 24 }}>
        <Field label="Update email address" hint="Changing your email will require you to verify it again.">
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="you@example.com" 
          />
        </Field>
        <Button onClick={saveEmail} disabled={busy || email === user?.email} block>
          {busy ? 'Saving…' : 'Save email'}
        </Button>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <strong>Contact verification</strong>
        <p className="muted" style={{ marginTop: 6, fontSize: '.92em' }}>
          Verified methods can be used to sign in and recover your account. Values are masked and never shown publicly.
        </p>
      </div>
    </SettingsShell>
  );
}
