'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Page() {
  const [mic, setMic] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [cam, setCam] = useState<'idle' | 'granted' | 'denied'>('idle');

  async function request(type: 'mic' | 'cam') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(type === 'mic' ? { audio: true } : { video: true });
      stream.getTracks().forEach((t) => t.stop());
      if (type === 'mic') setMic('granted'); else setCam('granted');
    } catch {
      if (type === 'mic') setMic('denied'); else setCam('denied');
    }
  }

  return (
    <>
      <header className="topbar"><a href="/app/settings/calls" style={{ padding: 8, fontSize: 20 }} aria-label="Back">←</a><h1>Call permissions</h1><div className="topbar-actions" /></header>
      <div className="page">
        <p className="muted">Verify that this device can access your microphone and camera before joining a call. Each request here uses your real browser permission dialog.</p>
        <Card>
          <strong>Microphone</strong>
          <p className="muted" style={{ marginTop: 4, fontSize: '.92em' }}>
            {mic === 'idle' ? 'Not yet requested.' : mic === 'granted' ? 'Access granted for this session.' : 'Access denied. Enable it in your browser settings.'}
          </p>
          <Button size="sm" variant="outline" onClick={() => request('mic')}>Request microphone</Button>
        </Card>
        <Card>
          <strong>Camera</strong>
          <p className="muted" style={{ marginTop: 4, fontSize: '.92em' }}>
            {cam === 'idle' ? 'Not yet requested.' : cam === 'granted' ? 'Access granted for this session.' : 'Access denied. Enable it in your browser settings.'}
          </p>
          <Button size="sm" variant="outline" onClick={() => request('cam')}>Request camera</Button>
        </Card>
        <Card>
          <strong>Speaker / audio output</strong>
          <p className="muted" style={{ marginTop: 4, fontSize: '.92em' }}>Device selection and audio routing await the calling infrastructure.</p>
        </Card>
        <p className="muted" style={{ fontSize: '.85em', marginTop: 16 }}>
          Granting permission here does not start a call. Real calling (signaling, media transport, group layouts) is not yet implemented.
        </p>
      </div>
    </>
  );
}
