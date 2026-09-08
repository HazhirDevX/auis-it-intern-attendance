"use client";
import { useEffect, useState } from "react";
const messages = [
  "📡 Contacting the mothership…",
  "💾 Asking the database nicely…",
  "🧠 Calculating extremely serious intern statistics…",
  "🐛 Checking whether the bugs are awake…",
];
export function LoadingSignal() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % messages.length),
      3500,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex items-center gap-3">
      <span className="pixel-loader" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <p className="font-mono text-xs text-muted-foreground">
        {messages[index]}
      </p>
    </div>
  );
}
