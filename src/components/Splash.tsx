'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Tuning
const SPLASH_DURATION_MS = 5400;
const SAFETY_TIMEOUT_MS = 15000;

// ---------------------------------------------------------------
// Wrapper — decides WHEN to show the splash.
// ONLY on the landing page (pathname === '/'). Every time.
// Everything else — /app, /login, /admin, /onboarding, /legal, etc.
// — never shows the splash.
// ?splash=0 on any URL still disables for that page load (dev shortcut).
// ---------------------------------------------------------------
export function Splash() {
  const pathname = usePathname();
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('splash') === '0') setDisabled(true);
  }, []);

  // Landing page only. Navigating to '/' from anywhere re-mounts
  // SplashAnimation → animation plays from the start. Navigating away
  // unmounts it → no splash on subsequent pages.
  if (disabled || pathname !== '/') return null;

  return <SplashAnimation />;
}

// ---------------------------------------------------------------
// Animation — the canvas ribbon + tagline
// ---------------------------------------------------------------
function SplashAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Safety net — force-remove after N seconds if the animation stalls
  useEffect(() => {
    const t = setTimeout(() => {
      console.log('[Splash] safety timeout — force-hiding');
      const el = containerRef.current;
      if (el) el.style.display = 'none';
    }, SAFETY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const d = containerRef.current;
    const c = canvasRef.current;
    if (!d || !c) return;

    const ctx = c.getContext('2d');
    if (!ctx) {
      d.style.transition = 'opacity .4s';
      d.style.opacity = '0';
      const t = setTimeout(() => { d.style.display = 'none'; }, 450);
      return () => clearTimeout(t);
    }

    const params = new URLSearchParams(window.location.search);
    const motionOverride = params.get('motion');

    let RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      const ui = JSON.parse(localStorage.getItem('strings.ui') || 'null');
      if (ui?.set?.motion) RM = true;
    } catch {}
    if (document.documentElement.classList.contains('rm')) RM = true;
    if (motionOverride === '1') RM = false;
    if (motionOverride === '0') RM = true;

    let t0 = performance.now();
    let run = true;
    let ended = false;
    let W = 0, H = 0;
    let rafId = 0;
    let endTimer: ReturnType<typeof setTimeout> | null = null;

    const fit = () => {
      const r = c.getBoundingClientRect();
      const k = Math.min(devicePixelRatio || 1, 2);
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      c.width = W * k;
      c.height = H * k;
      ctx.setTransform(k, 0, 0, k, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);

    const LT = Array.from(d.querySelectorAll<HTMLElement>('.splash-letter'));
    const GT = Array.from(d.querySelectorAll<HTMLElement>('.splash-word'));

    const total = SPLASH_DURATION_MS / 1000;
    const T_WORD = total * (2.9 / 5.4);
    const T_TAG = total * (3.7 / 5.4);
    const T_END = total;
    const N = 9, S = 240;

    const cl0 = (v: number) => Math.max(0, Math.min(1, v));
    const sm = (v: number) => v * v * (3 - 2 * v);

    const rv = (el: HTMLElement, u: number) => {
      const e = 1 - Math.pow(1 - u, 3);
      el.style.opacity = String(e);
      el.style.transform = `translateY(${(1 - e) * 10}px)`;
      el.style.filter = `blur(${(1 - e) * 6}px)`;
    };

    const pt = (s: number, k: number, tw: number, yaw: number, pitch: number): [number, number, number] => {
      const t = s * 6.2832;
      const bx = Math.sin(2 * t) * 0.5;
      const by = -Math.sin(t);
      const dx = Math.cos(2 * t);
      const dy = -Math.cos(t);
      const L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L;
      const ny = dx / L;
      const ph = t + tw;
      const o = k * 0.23;
      const X0 = bx + o * Math.cos(ph) * nx;
      const Y0 = by + o * Math.cos(ph) * ny;
      const Z = o * Math.sin(ph) * 1.6;
      const wd = 1 + 0.14 * Y0;
      const rt = -0.1;
      const X = (X0 * wd) * Math.cos(rt) - Y0 * Math.sin(rt);
      const Y = (X0 * wd) * Math.sin(rt) + Y0 * Math.cos(rt);
      const x1 = X * Math.cos(yaw) + Z * Math.sin(yaw);
      const z1 = -X * Math.sin(yaw) + Z * Math.cos(yaw);
      const y1 = Y * Math.cos(pitch) - z1 * Math.sin(pitch);
      const z2 = Y * Math.sin(pitch) + z1 * Math.cos(pitch);
      const f = 5 / (5 + z2);
      return [x1 * f, y1 * f, f];
    };

    const end = () => {
      if (ended) return;
      ended = true;
      d.style.transition = 'opacity .7s, transform .7s cubic-bezier(.32,.72,0,1)';
      d.style.opacity = '0';
      d.style.transform = 'scale(1.05)';
      d.style.pointerEvents = 'none';
      endTimer = setTimeout(() => {
        run = false;
        if (rafId) cancelAnimationFrame(rafId);
        d.style.display = 'none';
      }, 750);
    };

    const draw = (n: number) => {
      if (!run) return;
      const t = (n - t0) / 1000;
      const col = getComputedStyle(document.body).color || '#0a0a0a';
      const sc = Math.min(W * 0.3, H * 0.4);
      const cx = W / 2, cy = H / 2;

      LT.forEach((el, i) => rv(el, cl0((t - T_WORD - i * 0.08) / 0.55)));
      GT.forEach((el, i) => rv(el, cl0((t - T_TAG - i * 0.07) / 0.5)));
      if (t > T_END) end();

      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = col;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const spin = Math.exp(-Math.max(0, t - 1.2) * 0.8) * 6.5;
      const yaw = spin + Math.sin(t * 0.9) * 0.3 * Math.exp(-Math.max(0, t - 2.6) * 0.7);
      const pitch = 0.16 * Math.sin(t * 0.7) * Math.exp(-Math.max(0, t - 2.6) * 0.7);
      const tw = Math.sin(t * 1.2) * 0.25 * Math.exp(-Math.max(0, t - 2.6) * 0.7);
      const amp = 30 * Math.exp(-Math.max(0, t - 0.2) * 0.85);

      for (let k = 0; k < N; k++) {
        const kk = k - (N - 1) / 2;
        const w = 1 - Math.abs(kk) / 5;
        ctx.beginPath();
        for (let i = 0; i <= S; i++) {
          const s = i / S;
          const e = sm(cl0((t - 0.9 - 0.05 * k - 0.4 * s) / 1.2));
          const lx = cx + (s - 0.5) * W * 0.98;
          const ly = cy + kk * 11
            + Math.sin(s * Math.PI * 3 + t * 18 + k * 0.35) * amp * Math.sin(Math.PI * s)
            + Math.sin(s * Math.PI * 5 - t * 27) * amp * 0.3 * Math.sin(Math.PI * s);
          const p = pt(s, kk, tw, yaw, pitch);
          const gx = cx + p[0] * sc;
          const gy = cy + p[1] * sc;
          const X2 = lx + (gx - lx) * e;
          const Y2 = ly + (gy - ly) * e;
          if (i) ctx.lineTo(X2, Y2); else ctx.moveTo(X2, Y2);
        }
        ctx.globalAlpha = 0.9 + 0.1 * w;
        ctx.lineWidth = 1.9 + w * 1.7;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    };

    if (RM) {
      LT.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; el.style.filter = 'none'; });
      GT.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; el.style.filter = 'none'; });
      endTimer = setTimeout(end, 1200);
    } else {
      rafId = requestAnimationFrame(draw);
    }

    const replay = () => {
      if (RM) return;
      ended = false;
      if (endTimer) { clearTimeout(endTimer); endTimer = null; }
      d.style.opacity = '';
      d.style.transform = '';
      d.style.pointerEvents = '';
      d.style.display = '';
      t0 = performance.now();
      if (!run) { run = true; rafId = requestAnimationFrame(draw); }
    };
    d.addEventListener('click', replay);

    return () => {
      run = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (endTimer) clearTimeout(endTimer);
      ro.disconnect();
      d.removeEventListener('click', replay);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="splash"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'var(--bg, #fff)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '0 24px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          width: 'min(560px, 92vw)',
          height: 'min(360px, 46vh)',
          display: 'block',
        }}
      />
      <p
        aria-label="Strings"
        style={{
          margin: 0,
          fontSize: 'clamp(26px, 7vw, 40px)',
          letterSpacing: '0.42em',
          marginRight: '-0.42em',
          fontWeight: 500,
          textTransform: 'uppercase',
          color: 'var(--tx, #0a0a0a)',
          lineHeight: 1,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {(['S','T','R','I','N','G','S'] as const).map((c, i) => (
          <i
            key={i}
            className="splash-letter"
            style={{
              fontStyle: 'normal',
              display: 'inline-block',
              opacity: 0,
              transform: 'translateY(10px)',
              filter: 'blur(6px)',
              willChange: 'transform, opacity, filter',
            }}
          >{c}</i>
        ))}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 'clamp(11px, 3.1vw, 14px)',
          lineHeight: 1.55,
          color: 'var(--tx-2, var(--t2, #767676))',
          letterSpacing: '0.04em',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          fontWeight: 500,
        }}
      >
        {['Connect','in','transparency...','black','and','white.'].map((w, i, arr) => (
          <span
            key={i}
            className="splash-word"
            style={{
              display: 'inline-block',
              marginRight: i < arr.length - 1 ? '0.35em' : 0,
              opacity: 0,
              transform: 'translateY(6px)',
              filter: 'blur(4px)',
              willChange: 'transform, opacity, filter',
            }}
          >{w}</span>
        ))}
      </p>
    </div>
  );
}
