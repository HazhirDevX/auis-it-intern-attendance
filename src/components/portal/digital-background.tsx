"use client";
import { useEffect, useRef } from "react";
export function DigitalBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const media = matchMedia(
      "(prefers-reduced-motion: no-preference) and (pointer: fine) and (min-width: 1024px)",
    );
    let frame = 0,
      x = -1000,
      y = -1000,
      width = 0,
      height = 0;
    const draw = () => {
      frame = 0;
      if (!media.matches || document.hidden) return;
      ctx.clearRect(0, 0, width, height);
      for (let px = 18; px < width; px += 38)
        for (let py = 18; py < height; py += 38) {
          const dx = px - x,
            dy = py - y,
            d = Math.hypot(dx, dy),
            force = Math.max(0, 1 - d / 180);
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
      schedule();
    };
    const leave = () => {
      x = -1000;
      y = -1000;
      schedule();
    };
    const preference = () => {
      ctx.clearRect(0, 0, width, height);
      resize();
    };
    resize();
    addEventListener("resize", resize, { passive: true });
    addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", schedule);
    media.addEventListener("change", preference);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", schedule);
      media.removeEventListener("change", preference);
    };
  }, []);
  return <canvas ref={ref} className="digital-background" aria-hidden="true" />;
}
