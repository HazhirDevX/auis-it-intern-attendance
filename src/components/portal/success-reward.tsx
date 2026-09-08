"use client";
import type { CSSProperties } from "react";
export function SuccessReward({
  message,
  achievement = false,
}: {
  message: string;
  achievement?: boolean;
}) {
  return (
    <div role="status" className="success-pixels">
      <strong className="block font-mono text-xs uppercase tracking-wider">
        {achievement ? "🏆 Achievement unlocked" : "✅ Activity logged"}
      </strong>
      <p className="mt-2 text-sm">{message}</p>
      {Array.from({ length: 12 }, (_, i) => (
        <i
          aria-hidden
          key={i}
          style={
            {
              "--dx": `${((i % 4) - 1.5) * 35}px`,
              "--dy": `${-30 - (i % 3) * 24}px`,
              animationDelay: `${i * 18}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
