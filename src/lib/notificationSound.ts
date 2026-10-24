let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC() as AudioContext;
    }
    const c: AudioContext | null = ctx;
    if (!c) return null;
    if (c.state === 'suspended') c.resume().catch(() => {});
    return c;
  } catch { return null; }
}

function tone(freq: number, start: number, dur: number, gainVal = 0.15) {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, c.currentTime + start);
    gain.gain.linearRampToValueAtTime(gainVal, c.currentTime + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur);
  } catch {}
}

export function playMessagePing() { tone(880, 0, 0.25, 0.12); tone(1320, 0.1, 0.35, 0.1); }
export function playIncomingRing() { tone(660, 0, 0.4, 0.12); tone(880, 0.5, 0.4, 0.12); }
export function playCallEnded() { tone(440, 0, 0.2, 0.1); tone(330, 0.15, 0.3, 0.08); }
