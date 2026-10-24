'use client';
import { useRef, useState } from 'react';

export const mmss = (s: number) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '' });
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.start();
      startRef.current = Date.now();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startRef.current) / 1000));
      }, 200);
      return true;
    } catch { return false; }
  }

  function stop(): Promise<{ url: string; duration: number } | null> {
    return new Promise((resolve) => {
      const rec = recRef.current;
      if (!rec) return resolve(null);
      const dur = Math.max(1, Math.floor((Date.now() - startRef.current) / 1000));
      rec.onstop = async () => {
        rec.stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const fd = new FormData();
          fd.append('file', new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' }));
          const r = await fetch('/api/upload', { method: 'POST', body: fd });
          const d = await r.json();
          if (d.ok) resolve({ url: d.url, duration: dur });
          else resolve(null);
        } catch { resolve(null); }
      };
      rec.stop();
    });
  }

  function cancel() {
    recRef.current?.stream.getTracks().forEach((t) => t.stop());
    try { recRef.current?.stop(); } catch {}
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setDuration(0);
  }

  return { recording, duration, start, stop, cancel };
}
