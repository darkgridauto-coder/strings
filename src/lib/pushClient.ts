'use client';

export async function registerPush(): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === 'undefined') return { ok: false, error: 'Not in browser' };
  if (!('serviceWorker' in navigator)) return { ok: false, error: 'Service workers not supported' };
  if (!('PushManager' in window)) return { ok: false, error: 'Push not supported' };
  if (Notification.permission === 'denied') return { ok: false, error: 'Notifications blocked in browser' };

  const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, error: 'Permission denied' };

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const keyRes = await fetch('/api/push/vapid-public-key').then((r) => r.json());
  if (!keyRes.ok) return { ok: false, error: 'Push not configured on server' };

  const urlBase64ToUint8Array = (b64: string) => {
    const padding = '='.repeat((4 - (b64.length % 4)) % 4);
    const b = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyRes.publicKey),
    });
  }

  const json = sub.toJSON();
  const r = await fetch('/api/push/subscribe', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: json }),
  });
  if (!r.ok) return { ok: false, error: 'Failed to save subscription' };
  return { ok: true };
}

export async function unregisterPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => {});
    await fetch('/api/push/subscribe', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    }).catch(() => {});
  }
}
