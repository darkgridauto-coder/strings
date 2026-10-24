'use client';
import { useEffect, useRef } from 'react';

export function WelcomeHero() {
  const cRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = cRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, k = 1, yw = 0, pt = 0, ty = 0, tp = 0;
    let raf = 0;
    const t0 = performance.now();

    const fit = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      k = Math.min(W / 11, H / 6.4);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      ty = ((e.clientX - r.left) / r.width - .5) * .9;
      tp = ((e.clientY - r.top) / r.height - .5) * .5;
    };
    wrap.addEventListener('pointermove', onMove);

    const pr = (X: number, Y: number, Z: number): [number, number, number] => {
      const a = yw, b = pt + .12;
      const x1 = X * Math.cos(a) + Z * Math.sin(a);
      const z1 = -X * Math.sin(a) + Z * Math.cos(a);
      const y1 = Y * Math.cos(b) - z1 * Math.sin(b);
      const z2 = Y * Math.sin(b) + z1 * Math.cos(b);
      const f = 12 / (12 + z2);
      return [W / 2 + x1 * k * f, H / 2 + y1 * k * f, f];
    };

    const mk = (cx: number, ang: number, t: number, p0: number) => {
      const by = Math.sin(t * 1.1 + p0) * .14;
      const co = Math.cos(ang), si = Math.sin(ang);
      return (a: number, b: number, z: number): [number, number, number] =>
        [cx + a * co + z * si, b + by, -a * si + z * co];
    };

    const poly = (pts: [number, number, number][], fill: boolean, close: boolean) => {
      ctx.beginPath();
      pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
      if (close) ctx.closePath();
      fill ? ctx.fill() : ctx.stroke();
    };

    const hw = .62, hh = 1.1, d = .08;
    const phone = (w: (a: number, b: number, z: number) => [number, number, number], t: number) => {
      const V = (a: number, b: number, z: number) => pr(...w(a, b, z));
      const F: [number, number][] = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
      const ci = (cx: number, cy: number, r: number, z: number) =>
        Array.from({ length: 29 }, (_, i) => V(cx + Math.cos(i / 28 * 6.283) * r, cy + Math.sin(i / 28 * 6.283) * r, z));

      ctx.lineWidth = 1.2; ctx.globalAlpha = .28;
      poly(F.map(([a, b]) => V(a, b, d)), false, true);
      F.forEach(([a, b]) => poly([V(a, b, d), V(a, b, -d)], false, false));
      const fr = F.map(([a, b]) => V(a, b, -d));
      ctx.globalAlpha = .08; poly(fr, true, true);
      ctx.globalAlpha = .95; ctx.lineWidth = 1.8; poly(fr, false, true);
      ctx.lineWidth = 1; ctx.globalAlpha = .35;
      poly(([[-hw + .1, -hh + .2], [hw - .1, -hh + .2], [hw - .1, hh - .2], [-hw + .1, hh - .2]] as [number, number][])
        .map(([a, b]) => V(a, b, -d - .002)), false, true);
      ctx.globalAlpha = .6;
      poly([V(-.12, -hh + .1, -d - .002), V(.12, -hh + .1, -d - .002)], false, false);
      ctx.lineWidth = 1.6; ctx.globalAlpha = .9;
      poly(ci(0, -.28, .2, -d - .003), false, true);
      poly(Array.from({ length: 21 }, (_, i) => {
        const a = i / 20 * Math.PI;
        return V(Math.cos(a) * .4, .55 - Math.sin(a) * .4, -d - .003);
      }), false, false);
      const q = ((t * .7) % 1);
      ctx.globalAlpha = (1 - q) * .55; ctx.lineWidth = 1.2;
      poly(ci(0, -.28, .2 + .5 * q, -d - .003), false, true);
      ctx.globalAlpha = .9;
      ctx.beginPath();
      const e = V(0, .8, -d - .003);
      ctx.arc(e[0], e[1], 5 * e[2], 0, 6.283);
      ctx.fill();
    };

    const sp = (A: [number, number, number], B: [number, number, number], u: number, s: number, t: number): [number, number, number] => {
      const e = Math.sin(Math.PI * u), am = .2 + .1 * Math.sin(t * .9), ph = u * Math.PI * 3 - t * 4.2 + s;
      return pr(
        A[0] + (B[0] - A[0]) * u,
        A[1] + (B[1] - A[1]) * u + e * .55 + s * .06 + am * e * Math.sin(ph),
        A[2] + (B[2] - A[2]) * u + s * .14 + am * 1.3 * e * Math.cos(ph)
      );
    };

    const PT = Array.from({ length: 44 }, (_, i) => [
      Math.sin(i * 12.9) * 7.5,
      Math.sin(i * 78.2) * 3.6,
      Math.sin(i * 37.7) * 3.5,
    ]);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const col = getComputedStyle(wrap).color;
      ctx.strokeStyle = col; ctx.fillStyle = col;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';

      ctx.lineWidth = 1; ctx.globalAlpha = .1;
      for (let g = -8; g <= 8; g += 2) poly([pr(g, 2.7, -3), pr(g, 2.7, 5)], false, false);
      for (let z = -3; z <= 5; z += 2) poly([pr(-8, 2.7, z), pr(8, 2.7, z)], false, false);

      PT.forEach(([a, b, z], i) => {
        const p = pr(a, ((b + t * .12 * (1 + i % 3) + 3.6) % 7.2) - 3.6, z);
        ctx.globalAlpha = .1 + .3 * p[2] * .7;
        ctx.beginPath();
        ctx.arc(p[0], p[1], 1.4 * p[2], 0, 6.283);
        ctx.fill();
      });

      const wL = mk(-3.4, -.4, t, 0);
      const wR = mk(3.4, .4, t, 2.2);
      phone(wL, t);
      phone(wR, t + .5);

      const A = wL(hw, -.15, 0);
      const B = wR(-hw, -.15, 0);
      [-1, 0, 1].forEach((s) => {
        let p = sp(A, B, 0, s, t);
        for (let i = 1; i <= 72; i++) {
          const n = sp(A, B, i / 72, s, t);
          ctx.globalAlpha = s ? .45 : .95;
          ctx.lineWidth = (s ? .8 : 1.2) + 1.3 * n[2];
          poly([p, n], false, false);
          p = n;
        }
      });

      ctx.shadowColor = col;
      ctx.shadowBlur = 14;
      ctx.globalAlpha = 1;
      for (let j = 0; j < 3; j++) {
        const p = sp(A, B, (t * .22 + j / 3) % 1, 0, t);
        ctx.beginPath();
        ctx.arc(p[0], p[1], 3.4 * p[2], 0, 6.283);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    const frame = (n: number) => {
      raf = requestAnimationFrame(frame);
      if (!W) return;
      const t = RM ? 2 : (n - t0) / 1000;
      yw += ((Math.sin(t * .35) * .38 + ty) - yw) * .06;
      pt += (tp - pt) * .06;
      draw(t);
    };
    if (!RM) raf = requestAnimationFrame(frame);
    else draw(2);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div ref={wrapRef} className="hero-pane">
      <p className="ht">Connect in transparency... black and white.</p>
      <canvas ref={cRef} aria-hidden="true" />
      <p className="hw">Strings</p>
    </div>
  );
}
