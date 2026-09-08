import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Terminal, LockKeyhole } from "lucide-react";
import { signInWithGoogle } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth/dal";
import { Button } from "@/components/ui/button";
import { PublicFooter } from "@/components/public-footer";
import { DigitalBackground } from "@/components/portal/digital-background";
export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/?view=dashboard");
  const configured = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );
  return (
    <main className="login-v3">
      <DigitalBackground />
      <header className="login-brand">
        <Image
          src="/auis-logo.png"
          alt="American University of Iraq, Sulaimani"
          width={424}
          height={112}
          priority
          className="h-auto w-40"
        />
        <span className="font-mono text-[10px] tracking-wider">
          IT DEPARTMENT / INTERN PORTAL
        </span>
      </header>
      <div className="login-grid">
        <section className="min-w-0">
          <p className="mb-5 font-mono text-xs tracking-widest text-[#886708]">
            AUIS × IT × YOU
          </p>
          <h1 className="text-[clamp(2.6rem,6vw,5.5rem)] leading-[1.03] font-semibold tracking-[-.06em]">
            Big ideas.
            <br />
            Small fixes.
            <br />
            <span className="text-[#a17a0b]">Real impact.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
            Your internship deserves more than a spreadsheet. Log your work,
            track your missions, and watch those small wins add up. 🚀
          </p>
          <form action={signInWithGoogle} className="mt-8">
            <Button
              size="lg"
              disabled={!configured}
              className="h-12 w-full gap-4 bg-[#102e42] px-6 sm:w-auto"
            >
              Continue with AUIS Google
              <ArrowRight className="size-4" />
            </Button>
          </form>
          <p className="mt-4 flex max-w-md items-start gap-2 text-xs leading-5 text-muted-foreground">
            <LockKeyhole className="mt-1 size-3 shrink-0" />
            {configured
              ? "Only registered AUIS and explicitly approved Google accounts can enter."
              : "Google OAuth configuration is pending administrator setup."}
          </p>
        </section>
        <section className="login-terminal" aria-label="Portal capabilities">
          <div className="flex items-center justify-between border-b border-white/15 px-6 py-4 font-mono text-[10px] tracking-widest">
            <span className="flex items-center gap-2">
              <Terminal className="size-4" /> INTERN_WORKSPACE
            </span>
            <span className="text-[#89cfb7]">READY</span>
          </div>
          <div className="space-y-7 p-6 sm:p-8">
            <p className="font-mono text-sm text-[#e5c56a]">
              Hello, future problem-solver. 👋
            </p>
            <h2 className="text-3xl leading-tight font-semibold tracking-tight">
              Not all heroes
              <br />
              wear admin badges.
            </h2>
            <ol className="space-y-5">
              {[
                [
                  "01",
                  "🛠️ Log your work",
                  "Printer rescued? Network fixed? Make it count.",
                ],
                [
                  "02",
                  "📊 Read the signal",
                  "Hours, activities, and progress. All in sync.",
                ],
                [
                  "03",
                  "🏆 Unlock the next win",
                  "Weekly, monthly, semester. One mission at a time.",
                ],
              ].map(([n, t, d]) => (
                <li
                  key={n}
                  className="grid grid-cols-[25px_1fr] gap-x-3 border-t border-white/10 pt-4"
                >
                  <span className="font-mono text-[10px] text-[#b9a45e]">
                    {n}
                  </span>
                  <h3 className="text-sm font-semibold">{t}</h3>
                  <p className="col-start-2 mt-1 text-xs leading-5 text-slate-300">
                    {d}
                  </p>
                </li>
              ))}
            </ol>
            <p className="border-t border-white/15 pt-5 font-mono text-[11px] text-[#89cfb7]">
              SYSTEM NOTE: Have you tried turning it off and on? 🤖
            </p>
          </div>
        </section>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-5 px-6 pb-6 text-xs underline-offset-4">
        <Link className="hover:underline" href="/privacy">
          Privacy
        </Link>
        <Link className="hover:underline" href="/terms">
          Terms
        </Link>
      </nav>
      <PublicFooter />
    </main>
  );
}
