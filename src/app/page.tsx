import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Database,
  LockKeyhole,
} from "lucide-react";

import { signInWithGoogle } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth/dal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const oauthConfigured = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071d37] text-white">
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_15%_20%,rgba(196,152,27,.24),transparent_25rem),radial-gradient(circle_at_90%_80%,rgba(47,107,122,.3),transparent_30rem)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl gap-12 px-5 py-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10">
        <section className="flex flex-col items-start">
          <Image
            src="/auis-logo.png"
            alt="American University of Iraq, Sulaimani"
            width={424}
            height={112}
            priority
            className="h-auto w-48 sm:w-60"
          />
          <Badge className="mt-12 border-[#c4981b]/35 bg-[#c4981b]/10 px-3 py-1 text-[#f3d77a]">
            AUIS IT Department · Internal Portal
          </Badge>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl lg:text-6xl lg:leading-[1.02]">
            Internship progress,
            <span className="block text-[#d7b64f]">accounted for.</span>
          </h1>
          <p className="mt-6 max-w-xl text-balance text-base leading-7 text-slate-300 sm:text-lg">
            Log daily work, understand your progress, and keep every semester’s
            activity history in one secure AUIS workspace.
          </p>

          <form action={signInWithGoogle} className="mt-9 w-full sm:w-auto">
            <Button
              size="lg"
              disabled={!oauthConfigured}
              className="h-12 w-full bg-[#c4981b] px-6 font-semibold text-[#071d37] shadow-lg shadow-black/20 hover:bg-[#d5ac32] sm:w-auto"
            >
              Continue with AUIS Google
              <ArrowRight className="size-4" />
            </Button>
          </form>
          <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
            <LockKeyhole className="size-4 text-[#d7b64f]" />
            {oauthConfigured
              ? "Only registered @auis.edu.krd accounts can enter."
              : "Google OAuth configuration is pending administrator setup."}
          </div>
        </section>

        <section aria-label="Portal capabilities" className="pb-6 lg:pb-0">
          <Card className="overflow-hidden border-white/10 bg-white/[0.97] text-[#17283b] shadow-2xl shadow-black/30">
            <div className="border-b bg-[#f7f4eb] px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6a11]">
                    Built for every semester
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    One reliable attendance timeline
                  </h2>
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-[#0b2545] text-[#f2cf62]">
                  <Database className="size-5" />
                </div>
              </div>
            </div>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
              {[
                [Clock3, "Daily logs", "Fast, validated hour submission"],
                [
                  BarChart3,
                  "Clear analytics",
                  "Progress without dashboard clutter",
                ],
                [
                  CheckCircle2,
                  "Admin controls",
                  "Interns, semesters, and exports",
                ],
                [
                  LockKeyhole,
                  "Server-enforced access",
                  "Domain plus approved-user checks",
                ],
              ].map(([Icon, title, description]) => (
                <div
                  key={String(title)}
                  className="rounded-xl border bg-white p-4 transition-transform hover:-translate-y-0.5"
                >
                  <Icon className="size-5 text-[#a57c10]" />
                  <h3 className="mt-4 text-sm font-semibold">
                    {String(title)}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {String(description)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400">
            Code. Coffee. Internship. Repeat. ☕
            <Link href="/privacy" className="underline-offset-4 hover:text-slate-200 hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="underline-offset-4 hover:text-slate-200 hover:underline">
              Terms
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
