import { NextResponse } from "next/server";

import { auth } from "@/auth";

const legacyViewRoutes: Record<string, string> = {
  "/dashboard": "dashboard",
  "/log-hours": "log-hours",
  "/activities": "activities",
  "/analytics": "analytics",
  "/admin/interns": "interns",
  "/admin/semesters": "semesters",
  "/admin/export": "export",
  "/admin/audit": "audit",
};

export const proxy = auth((request) => {
  const view = legacyViewRoutes[request.nextUrl.pathname];
  if (view) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("view", view);
    return NextResponse.redirect(url);
  }

  const internMatch = request.nextUrl.pathname.match(
    /^\/admin\/interns\/([^/]+)$/,
  );
  if (internMatch) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    url.searchParams.set("view", "intern");
    url.searchParams.set("intern", internMatch[1]);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp)$).*)",
  ],
};
