import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 p-6 text-center">
      <div>
        <p className="text-5xl">🛰️</p>
        <h1 className="mt-5 text-3xl font-semibold text-primary">
          Signal not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          That portal page is outside the known IT universe.
        </p>
        <Button asChild className="mt-6">
          <Link href="/?view=dashboard">Return to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
