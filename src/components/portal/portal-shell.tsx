"use client";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  ClipboardPenLine,
  Download,
  FileClock,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  Terminal,
} from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { DigitalBackground } from "@/components/portal/digital-background";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
type ShellUser = {
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  image: string | null;
};
const studentLinks = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "log-hours", label: "Log Hours", icon: ClipboardPenLine },
  { view: "analytics", label: "Analytics", icon: BarChart3 },
  { view: "activities", label: "Activities", icon: Activity },
  { view: "history", label: "History", icon: FileClock },
];
const adminLinks = [
  { view: "interns", label: "Interns", icon: Users },
  { view: "semesters", label: "Semesters", icon: GraduationCap },
  { view: "export", label: "Excel Export", icon: Download },
  { view: "audit", label: "Audit History", icon: FileClock },
];
function Navigation({
  user,
  onNavigate,
}: {
  user: ShellUser;
  onNavigate?: () => void;
}) {
  const active = useSearchParams().get("view") ?? "dashboard";
  const links = (items: typeof studentLinks) =>
    items.map((item) => (
      <Link
        key={item.view}
        href={`/?view=${item.view}`}
        onClick={onNavigate}
        aria-current={
          active === item.view ||
          (item.view === "interns" && active === "intern")
            ? "page"
            : undefined
        }
        className="rail-link"
      >
        <item.icon className="size-4 shrink-0" aria-hidden />
        <span>{item.label}</span>
      </Link>
    ));
  return (
    <div className="rail-content">
      <Link
        href="/?view=dashboard"
        className="rail-brand"
        aria-label="Portal dashboard"
        onClick={onNavigate}
      >
        <Image
          src="/auis-logo.png"
          alt="AUIS"
          width={424}
          height={112}
          priority
          className="h-auto w-36"
        />
        <span className="rail-wordmark">
          IT INTERN PORTAL
          <span className="pixel-status" aria-hidden />
        </span>
      </Link>
      <div className="rail-section-label">
        <Terminal className="size-3" aria-hidden /> YOUR WORKSPACE
      </div>
      <nav className="rail-links" aria-label="Student navigation">
        {links(studentLinks)}
      </nav>
      {user.role === "ADMIN" && (
        <>
          <div className="rail-section-label">
            <ShieldCheck className="size-3" aria-hidden /> ADMIN CONTROLS
          </div>
          <nav className="rail-links" aria-label="Admin navigation">
            {links(adminLinks)}
          </nav>
        </>
      )}
      <div className="rail-user">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className="size-8 shrink-0 border">
            <AvatarImage src={user.image ?? undefined} alt="" />
            <AvatarFallback className="bg-primary text-xs text-white">
              {user.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p
              className="truncate text-[11px] text-muted-foreground"
              title={user.email}
            >
              {user.email}
            </p>
          </div>
        </div>
        <form action={signOutAction}>
          <Button variant="ghost" className="mt-2 w-full justify-start text-xs">
            <LogOut className="size-3.5" /> Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
export function PortalShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const workspace = useRef<HTMLDivElement>(null);
  const view = useSearchParams().get("view") ?? "dashboard";
  useEffect(() => {
    workspace.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);
  return (
    <div className="portal-frame">
      <DigitalBackground />
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="desktop-rail">
        <Navigation user={user} />
      </aside>
      <header className="mobile-rail">
        <Link href="/?view=dashboard" aria-label="Portal dashboard">
          <Image
            src="/auis-logo.png"
            alt="AUIS"
            width={424}
            height={112}
            className="h-auto w-24"
          />
        </Link>
        <span className="font-mono text-[10px] tracking-widest">
          IT / INTERN PORTAL
        </span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="mobile-menu w-[min(94vw,380px)] p-4"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Portal navigation</SheetTitle>
              <SheetDescription>
                Student workspace and administrator controls.
              </SheetDescription>
            </SheetHeader>
            <Navigation user={user} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>
      <div className="workspace" ref={workspace}>
        <div className="workspace-bar">
          <span>
            <span className="pixel-status" aria-hidden /> AUIS IT DEPARTMENT
          </span>
          <span>
            {user.role === "ADMIN" ? "ADMIN CONSOLE" : "INTERN WORKSPACE"}
            <span className="hidden sm:inline"> / HUMAN, NOT A BOT 🤖</span>
          </span>
        </div>
        <main id="main-content" tabIndex={-1} className="workspace-content">
          {children}
        </main>
      </div>
      <footer className="portal-footer">
        <span>
          <span className="mr-2 font-mono text-[#916800]" aria-hidden>
            &lt;/&gt;
          </span>
          Developed by the GOAT — Hazhir 🐐
        </span>
        <span className="hidden font-mono text-[10px] tracking-widest sm:inline">
          AUIS / IT
        </span>
      </footer>
    </div>
  );
}
