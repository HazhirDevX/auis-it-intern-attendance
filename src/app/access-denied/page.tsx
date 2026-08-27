import Image from "next/image";
import Link from "next/link";
import { Ban, Mail, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; error?: string }>;
}) {
  const { reason } = await searchParams;
  const domainError = reason === "domain";
  const roleError = reason === "forbidden";
  return (
    <main className="grid min-h-screen place-items-center bg-[#071d37] px-4 py-10">
      <Card className="w-full max-w-lg border-white/10 shadow-2xl">
        <CardContent className="p-7 text-center sm:p-10">
          <Image
            src="/auis-logo.png"
            alt="AUIS"
            width={424}
            height={112}
            className="mx-auto h-auto w-44"
          />
          <div className="mx-auto mt-8 grid size-14 place-items-center rounded-full bg-red-50 text-red-600">
            {domainError ? (
              <Ban className="size-7" />
            ) : (
              <ShieldAlert className="size-7" />
            )}
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-primary">
            Access denied
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {domainError
              ? "This portal only accepts verified AUIS accounts and explicitly approved Google accounts."
              : roleError
                ? "Your account is authorized, but this page requires an administrator role."
                : "You successfully entered AUIS territory, but you are not currently registered as an IT intern. Contact the IT Department administrator if you believe this is a mistake."}
          </p>
          <div className="mt-6 rounded-xl border bg-muted/50 p-4 text-left text-sm">
            <p className="flex items-center gap-2 font-medium text-primary">
              <Mail className="size-4 text-[#a57c10]" />
              Need access?
            </p>
            <p className="mt-1 pl-6 text-muted-foreground">
              {roleError
                ? "Return to your dashboard or ask an administrator if your assigned role is incorrect."
                : "Ask an IT Department administrator to add your email to the authorized intern list."}
            </p>
          </div>
          <Button asChild className="mt-7 w-full">
            <Link href="/">Return to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
