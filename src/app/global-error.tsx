"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-[#f6f7f9] p-6 text-center">
          <div>
            <p className="text-5xl">🧰</p>
            <h1 className="mt-5 text-3xl font-semibold text-[#0b2545]">
              The portal hit a technical snag
            </h1>
            <p className="mt-3 text-slate-600">
              No data was changed. Try loading this view again.
            </p>
            <Button className="mt-6" onClick={reset}>
              Try again
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
