"use client";
import { useEffect, useRef } from "react";

export function DigitalBackground() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia(
      "(prefers-reduced-motion: no-preference) and (pointer: fine) and (min-width: 1024px)",
    );
    let frame = 0;
    const move = (event: PointerEvent) => {
      if (!media.matches || frame) return;
      frame = requestAnimationFrame(() => {
        ref.current?.style.setProperty("--pointer-x", `${event.clientX}px`);
        ref.current?.style.setProperty("--pointer-y", `${event.clientY}px`);
        frame = 0;
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);
  return <div ref={ref} className="digital-background" aria-hidden="true" />;
}
