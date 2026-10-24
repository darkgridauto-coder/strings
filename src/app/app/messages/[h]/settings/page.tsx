'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Row } from '@/components/ui/Row';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { setLocked, setPinned, isPinned, isLocked, hasPin, setPin, verifyPin } from '@/lib/chatLock';

export default function Page({ params }: { params: { h: string } }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [convId, setConvId] = useState<string | null>(null);
  const [pinned, setPinnedState] = useState(false);
  const [locked, setLockedState] = useState(false);
  const [pin, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [unlockPin, setUnlockPin] = useState('');
  const [askUnlock, setAskUnlock] = useState(false);

  useEffect(() => {
    fetch('/api/conversations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: params.h }),
    }).then((r) => r.json()).then((d) => {
      if (d.ok) {
        setConvId(d.conversation.id);
        setPinnedState(isPinned(d.conversation.id));
        setLockedState(isLocked(d.conversation.id));
      }
    });
  }, [params.h]);

  function togglePinned() {
    if (!convId) return;
    const next = !pinned;
    setPinned(convId, next);
    setPinnedState(next);
    showToast(next ? 'Chat pinned' : 'Chat unpinned');
  }

  function toggleLock() {
    if (!convId) return;
    if (!locked) {
      if (!hasPin()) { showToast('Set a PIN below first'); return; }
      setAskUnlock(true);
      return;
    }
    setLocked(convId, false);
    setLockedState(false);
    showToast('Chat unlocked');
  }

  async function unlockAndLock() {
    if (!convId) return;
    if (!(await verifyPin(unlockPin))) { showToast('Wrong PIN'); return; }
    setLocked(convId, true);
    setLockedState(true);
    setAskUnlock(false);
    setUnlockPin('');
    showToast('Chat locked');
  }

  async function savePin() {
    if (pin !== pinConfirm) { showToast('PINs don\'t match'); return; }
    try {
      await setPin(pin);
      showToast('PIN saved');
      setPin(''); setPinConfirm('');
    } catch (e: any) { showToast(e.message || 'Could not save PIN'); }
  }

  return (
    <>
      <header className="topbar">
        <Link href={`/app/messages/${params.h}`} className="ib" aria-label="Back"><Icon name="back" /></Link>
        <h1>Conversation settings</h1>
        <div className="topbar-actions" />
      </header>
      <div className="page">
        <Row icon="user" title={`@${params.h}`} sub="View profile" href={`/app/u/${params.h}`} showChevron />
        <Row icon="bell" title="Mute notifications" sub="Not persisted server-side in this build" />
        <Row
          icon="save"
          title="Pin chat"
          sub={pinned ? 'Pinned to the top' : 'Keep at the top of the list'}
          trail={<button className={`pill ${pinned ? 'on' : ''}`} onClick={togglePinned}>{pinned ? 'Unpin' : 'Pin'}</button>}
        />
        <Row
          icon="lock"
          title="Lock chat"
          sub={locked ? 'Locked with your PIN' : hasPin() ? 'Require PIN to open' : 'Set a PIN below first'}
          trail={<button className={`pill ${locked ? 'on' : ''}`} onClick={toggleLock}>{locked ? 'Unlock' : 'Lock'}</button>}
        />
        <Row icon="img" title="Shared media" sub="View media shared here" href={`/app/messages/${params.h}/media`} showChevron />
        <Row icon="shield" title="Safety and encryption" sub="Verification status" href={`/app/messages/${params.h}/security`} showChevron />

        <h3>Chat PIN</h3>
        <Card>
          <p className="muted" style={{ fontSize: '.9em', margin: '0 0 12px' }}>
            A 4–8 digit PIN. Hashed with SHA-256; the raw PIN never leaves this device.
          </p>
          <label className="field"><span className="field-label">New PIN</span>
            <input type="password" inputMode="numeric" maxLength={8} value={pin} onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))} />
          </label>
          <label className="field"><span className="field-label">Confirm PIN</span>
            <input type="password" inputMode="numeric" maxLength={8} value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))} />
          </label>
          <Button onClick={savePin} block>Save PIN</Button>
        </Card>

        {askUnlock && (
          <Card>
            <strong>Enter PIN to lock</strong>
            <label className="field"><input type="password" inputMode="numeric" maxLength={8} value={unlockPin} onChange={(e) => setUnlockPin(e.target.value.replace(/\D/g, ''))} /></label>
            <Button onClick={unlockAndLock} block>Lock chat</Button>
          </Card>
        )}
      </div>
    </>
  );
}
