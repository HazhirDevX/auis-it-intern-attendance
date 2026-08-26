"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { href: "/log-hours", label: "Log Hours", icon: ClipboardPenLine },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/activities", label: "Activities", icon: Activity },
];

const adminLinks = [
  { href: "/admin/interns", label: "Interns", icon: Users },
  { href: "/admin/semesters", label: "Semesters", icon: GraduationCap },
  { href: "/admin/export", label: "Excel Export", icon: Download },
  { href: "/admin/audit", label: "Audit History", icon: FileClock },
];

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
}: {
  user: ShellUser;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const navClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      pathname === href || pathname.startsWith(`${href}/`)
        ? "bg-sidebar-accent text-white shadow-sm"
        : "text-slate-300 hover:bg-white/5 hover:text-white",
    );

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        mobile && "text-sidebar-foreground",
      )}
    >
      <Link
        href="/dashboard"
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
        <Link href="/dashboard" className={navClass("/dashboard")}>
          <LayoutDashboard className="size-4" />
          Overview
        </Link>
        {studentLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={navClass(link.href)}
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
                key={link.href}
                href={link.href}
                className={navClass(link.href)}
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
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] bg-sidebar px-5 py-6 lg:block">
        <Navigation user={user} />
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/90 px-4 backdrop-blur lg:hidden">
        <Link
          href="/dashboard"
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
        <Sheet>
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
            <Navigation user={user} mobile />
          </SheetContent>
        </Sheet>
      </header>

      <main className="min-w-0 lg:col-start-2">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
