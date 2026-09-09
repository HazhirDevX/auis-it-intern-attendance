"use client";
import { useEffect, useRef } from "react";
export function DigitalBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const media = matchMedia("(prefers-reduced-motion: no-preference)");
    let frame = 0,
      x = -1000,
      y = -1000,
      width = 0,
      height = 0,
      lastDraw = 0,
      touchedAt = -Infinity;
    const draw = (time: number) => {
      frame = 0;
      if (!media.matches || document.hidden) return;
      frame = requestAnimationFrame(draw);
      if (time - lastDraw < 1000 / (width < 1024 ? 24 : 30)) return;
      lastDraw = time;
      ctx.clearRect(0, 0, width, height);
      const touchStrength = Math.max(0, 1 - (time - touchedAt) / 1200);
      for (let px = 18; px < width; px += 38)
        for (let py = 18; py < height; py += 38) {
          const dx = px - x,
            dy = py - y,
            d = Math.hypot(dx, dy),
            force =
              Math.max(0, 1 - d / 180) *
              (touchedAt === -Infinity ? 1 : touchStrength);
          const offset = force * 9;
          ctx.fillStyle =
            force > 0
              ? `rgba(150,115,25,${0.12 + force * 0.35})`
              : "rgba(29,72,79,.085)";
          const size = force > 0 ? 2 + force * 2 : 2;
          ctx.fillRect(
            px + (d ? (dx / d) * offset : 0),
            py + (d ? (dy / d) * offset : 0),
            size,
            size,
          );
        }
      // A small, deterministic particle field adds ambient motion without React renders.
      const count = width < 600 ? 24 : width < 1024 ? 48 : 80;
      for (let i = 0; i < count; i++) {
        const phase = i * 2.39996;
        const px =
          ((i * 0.618034) % 1) * width + Math.sin(time / 4500 + phase) * 12;
        const py =
          ((i * 0.414214) % 1) * height + Math.cos(time / 5500 + phase) * 14;
        ctx.fillStyle = i % 3 ? "rgba(29,72,79,.13)" : "rgba(150,115,25,.22)";
        ctx.fillRect(px, py, i % 3 ? 2 : 3, i % 3 ? 2 : 3);
      }
    };
    const schedule = () => {
      if (!frame && media.matches && !document.hidden)
        frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      width = innerWidth;
      height = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      schedule();
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      touchedAt = e.pointerType === "touch" ? performance.now() : -Infinity;
      schedule();
    };
    const leave = () => {
      x = -1000;
      y = -1000;
      schedule();
    };
    const preference = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      ctx.clearRect(0, 0, width, height);
      resize();
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      schedule();
    };
    resize();
    addEventListener("resize", resize, { passive: true });
    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerdown", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibility);
    media.addEventListener("change", preference);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", move);
      removeEventListener("pointerdown", move);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", preference);
    };
  }, []);
  return <canvas ref={ref} className="digital-background" aria-hidden="true" />;
}
