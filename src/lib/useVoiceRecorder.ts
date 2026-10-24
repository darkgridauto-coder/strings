'use client';
import { useState, useRef } from 'react';

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorder.current = mr;
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      mr.start();
      setRecording(true);
      setDuration(0);
      timer.current = setInterval(() => setDuration(d => d + 1), 1000);
      return true;
    } catch (e) {
      console.error('Mic access denied', e);
      return false;
    }
  }

  function stop(): Promise<{ url: string; duration: number; blob: Blob } | null> {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || mediaRecorder.current.state !== 'recording') {
        resolve(null);
        return;
      }
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        mediaRecorder.current?.stream.getTracks().forEach(t => t.stop());
        resolve({ url, duration, blob });
      };
      mediaRecorder.current.stop();
      setRecording(false);
      if (timer.current) clearInterval(timer.current);
    });
  }

  function cancel() {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.onstop = null;
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
    }
    setRecording(false);
    if (timer.current) clearInterval(timer.current);
  }

  return { recording, duration, start, stop, cancel };
}
