"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Card className="border-amber-200 bg-amber-50/70">
      <CardContent className="grid min-h-72 place-items-center p-8 text-center">
        <div>
          <AlertTriangle className="mx-auto size-10 text-amber-600" />
          <h2 className="mt-4 text-xl font-semibold text-primary">
            The portal hit a temporary problem.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your data is safe. Try loading this view again.
          </p>
          <Button onClick={reset} className="mt-5">
            Try again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
