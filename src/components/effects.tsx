import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/** Full-page constellation background. Canvas never captures pointer events. */
export function NetworkBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const css = getComputedStyle(document.documentElement);
    const colors = [css.getPropertyValue("--primary-bright"), css.getPropertyValue("--cyan"), css.getPropertyValue("--accent")].map((c) => c.trim());
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999, px: 0, py: 0 };
    type P = { x: number; y: number; vx: number; vy: number; r: number; c: string };
    let pts: P[] = [];
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / (w < 640 ? 26000 : 17000)));
      pts = Array.from({ length: count }, (_, i) => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.4 + .6, c: colors[i % colors.length] ?? "white" }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      mouse.px += ((mouse.x > -999 ? (mouse.x / w - .5) * -18 : 0) - mouse.px) * .05;
      mouse.py += ((mouse.y > -999 ? (mouse.y / h - .5) * -18 : 0) - mouse.py) * .05;
      const link = w < 640 ? 90 : 130;
      for (const p of pts) {
        if (!reduce) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 120 && d > 0) { p.x += (dx / d) * .6; p.y += (dy / d) * .6; }
          p.x += p.vx; p.y += p.vy;
          if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        }
      }
      ctx.lineWidth = .6;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]!;
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j]!; const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link) { ctx.globalAlpha = (1 - d / link) * .22; ctx.strokeStyle = a.c; ctx.beginPath(); ctx.moveTo(a.x + mouse.px, a.y + mouse.py); ctx.lineTo(b.x + mouse.px, b.y + mouse.py); ctx.stroke(); }
        }
      }
      for (const p of pts) { ctx.globalAlpha = .75; ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(p.x + mouse.px, p.y + mouse.py, p.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    const move = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const leave = () => { mouse.x = mouse.y = -9999; };
    resize(); draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseleave", leave);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", move); document.removeEventListener("mouseleave", leave); };
  }, [reduce]);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-70" />;
}

/** Small glowing butterfly that glides after the cursor on fine-pointer devices. */
export function ButterflyCursor() {
  const wrap = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const el = wrap.current; const tr = trail.current;
    if (!el || !tr) return;
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2, x = tx, y = ty, angle = 0, raf = 0, last = 0, t = 0, seen = false;
    const move = (e: MouseEvent) => { tx = e.clientX + 22; ty = e.clientY + 18; if (!seen) { seen = true; x = tx; y = ty; el.style.opacity = "1"; } };
    const tick = (now: number) => {
      t = now;
      const dx = tx - x, dy = ty - y;
      x += dx * .08; y += dy * .08;
      const speed = Math.hypot(dx, dy);
      const target = speed > 2 ? Math.max(-35, Math.min(35, dx * .6)) : 0;
      angle += (target - angle) * .1;
      const bob = Math.sin(t / 420) * 3;
      el.style.transform = `translate3d(${x - 20}px, ${y - 17 + bob}px, 0) rotate(${angle}deg)`;
      if (seen && speed > 6 && now - last > 60) {
        last = now;
        const d = document.createElement("span");
        d.className = "butterfly-spark";
        d.style.left = `${x}px`; d.style.top = `${y + 4}px`;
        tr.appendChild(d);
        setTimeout(() => d.remove(), 900);
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", move); };
  }, [reduce]);
  if (reduce) return null;
  return (
    <div aria-hidden="true" className="butterfly-layer pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <div ref={trail} />
      <div ref={wrap} className="butterfly absolute left-0 top-0 opacity-0 transition-opacity duration-500">
        <ButterflySvg size={40} id="bf-cursor" />
      </div>
    </div>
  );
}

/** Touch devices: a gentle decorative butterfly instead of cursor following. */
export function HeroButterfly() {
  return (
    <div aria-hidden="true" className="hero-butterfly pointer-events-none absolute right-8 top-28 z-10 md:hidden">
      <div className="butterfly"><ButterflySvg size={30} id="bf-hero" /></div>
    </div>
  );
}

/** Morpho-style butterfly: four wings, each side hinged at the body and flapped in 3D. */
function ButterflySvg({ size, id }: { size: number; id: string }) {
  // Left side drawn; right side mirrored. Body axis at x=20.
  const up = `M19.4 14.5 C17 8 11 2.6 5 2.2 C1.6 2 .6 5 1.6 8.2 C2.8 12 6.4 15.6 11.5 16.8 C14.6 17.5 17.4 17 19.4 16 Z`;
  const low = `M19.4 17 C16.5 17.4 11.8 19 9.4 22.4 C7.6 25 8.2 28.6 11 29.2 C13.8 29.8 16.4 27 17.8 23.6 C18.8 21.4 19.3 19 19.4 17 Z`;
  const vein = `M19.3 15.2 C15 11 10 6.5 4.5 4 M19.3 15.6 C14.5 13.4 9 11.8 3 10.4 M19.3 16 C15 15.6 11 15.4 7.5 14.6`;
  const lowVein = `M19.3 17.6 C16 20 13 23.5 11.2 27.6 M19.3 17.8 C17.4 21 16.4 24 15.2 27`;
  const side = (s: 1 | -1) => (
    <g className={s === 1 ? "bf-wing bf-left" : "bf-wing bf-right"}>
      <g transform={s === -1 ? "translate(40 0) scale(-1 1)" : undefined}>
        <path d={low} fill={`url(#${id}-l)`} stroke="var(--cyan)" strokeWidth=".45" strokeOpacity=".7" />
        <path d={lowVein} fill="none" stroke="var(--foreground)" strokeOpacity=".28" strokeWidth=".3" />
        <circle cx="11.6" cy="26.4" r=".9" fill="var(--foreground)" opacity=".5" />
        <path d={up} fill={`url(#${id}-u)`} stroke="var(--cyan)" strokeWidth=".45" strokeOpacity=".8" />
        <path d={vein} fill="none" stroke="var(--foreground)" strokeOpacity=".3" strokeWidth=".3" />
        <path d="M2 7.5 C2.6 4.2 5 3 8 3.4" fill="none" stroke="var(--background)" strokeOpacity=".55" strokeWidth=".9" />
        <circle cx="5.2" cy="6.4" r=".8" fill="var(--foreground)" opacity=".6" />
      </g>
    </g>
  );
  return (
    <svg width={size} height={size * .82} viewBox="0 0 40 33" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}-u`} x1="1" y1=".85" x2="0" y2="0"><stop offset="0" stopColor="var(--cyan)" /><stop offset=".6" stopColor="var(--accent)" /><stop offset="1" stopColor="var(--primary)" stopOpacity=".9" /></linearGradient>
        <linearGradient id={`${id}-l`} x1="1" y1="0" x2=".2" y2="1"><stop offset="0" stopColor="var(--cyan)" /><stop offset="1" stopColor="var(--accent)" stopOpacity=".85" /></linearGradient>
      </defs>
      {side(1)}{side(-1)}
      <ellipse cx="20" cy="19" rx=".9" ry="6.8" fill="var(--foreground)" opacity=".9" />
      <ellipse cx="20" cy="13.4" rx="1.2" ry="1.5" fill="var(--foreground)" />
      <path d="M19.6 12.2 C18.6 8.6 17.2 6.6 15.6 5.6 M20.4 12.2 C21.4 8.6 22.8 6.6 24.4 5.6" fill="none" stroke="var(--foreground)" strokeWidth=".4" opacity=".75" />
      <circle cx="15.6" cy="5.6" r=".5" fill="var(--foreground)" opacity=".8" /><circle cx="24.4" cy="5.6" r=".5" fill="var(--foreground)" opacity=".8" />
    </svg>
  );
}
