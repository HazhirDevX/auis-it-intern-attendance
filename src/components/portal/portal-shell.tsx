"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { DigitalBackground } from "@/components/portal/digital-background";
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
} from "lucide-react";

import { signOutAction } from "@/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type ShellUser = {
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  image: string | null;
};

const studentLinks = [
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

function viewHref(view: string) {
  return `/?view=${view}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Navigation({
  user,
  mobile = false,
  onNavigate,
}: {
  user: ShellUser;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") ?? "dashboard";
  const navClass = (view: string) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      activeView === view
        ? "bg-sidebar-accent text-white shadow-sm"
        : "text-slate-300 hover:bg-white/5 hover:text-white",
    );

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-y-auto",
        mobile && "text-sidebar-foreground",
      )}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) onNavigate?.();
      }}
    >
      <Link
        href={viewHref("dashboard")}
        className="block px-1 py-1"
        aria-label="Portal dashboard"
      >
        <Image
          src="/auis-logo.png"
          alt="AUIS"
          width={424}
          height={112}
          className="h-auto w-44"
          priority
        />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#d9bd62]">
          IT Intern Portal
        </p>
      </Link>

      <nav className="mt-8 space-y-1" aria-label="Student navigation">
        <Link href={viewHref("dashboard")} className={navClass("dashboard")}>
          <LayoutDashboard className="size-4" />
          Dashboard
        </Link>
        {studentLinks.map((link) => (
          <Link
            key={link.view}
            href={viewHref(link.view)}
            className={navClass(link.view)}
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        ))}
      </nav>

      {user.role === "ADMIN" && (
        <>
          <div className="mt-7 flex items-center gap-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <ShieldCheck className="size-3.5 text-[#d9bd62]" />
            Admin only
          </div>
          <nav className="mt-2 space-y-1" aria-label="Admin navigation">
            {adminLinks.map((link) => (
              <Link
                key={link.view}
                href={viewHref(link.view)}
                className={navClass(link.view)}
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </>
      )}

      <div className="mt-auto pt-8">
        <Separator className="mb-5 bg-white/10" />
        <div className="flex items-center gap-3">
          <Avatar className="size-9 border border-white/10">
            <AvatarImage src={user.image ?? undefined} alt="" />
            <AvatarFallback className="bg-[#c4981b] text-xs font-semibold text-[#071d37]">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-white">
                {user.name}
              </p>
              {user.role === "ADMIN" && (
                <Badge className="h-4 bg-[#c4981b] px-1.5 text-[9px] text-[#071d37]">
                  ADMIN
                </Badge>
              )}
            </div>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <form action={signOutAction} className="mt-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-4" />
            Sign out
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
  return (
    <div className="portal-frame relative min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <DigitalBackground />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] bg-sidebar px-5 py-6 lg:block">
        <Navigation user={user} />
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/90 px-4 backdrop-blur lg:hidden">
        <Link
          href={viewHref("dashboard")}
          className="flex items-center gap-2 font-semibold text-primary"
        >
          <Image
            src="/auis-logo.png"
            alt="AUIS"
            width={424}
            height={112}
            className="h-auto w-24"
          />
          <span className="sr-only">IT Intern Portal</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(88vw,320px)] border-0 bg-sidebar p-6"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Portal navigation</SheetTitle>
              <SheetDescription>
                Navigate the AUIS IT Intern Portal.
              </SheetDescription>
            </SheetHeader>
            <Navigation user={user} mobile onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="relative min-w-0 outline-none lg:col-start-2"
      >
        <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
          <footer className="mt-12 flex items-center justify-between gap-4 border-t pt-5 text-xs text-muted-foreground">
            <span>Developed by Hazhir IT-Intern</span>
            <span className="font-mono text-[10px] uppercase tracking-widest">
              AUIS / IT
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}
