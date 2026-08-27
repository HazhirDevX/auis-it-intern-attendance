import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const siteUrl = "https://auis-it-intern-attendance.vercel.app";
const siteDescription =
  "Secure semester-based attendance, activity history, and analytics for AUIS IT Department interns.";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AUIS IT Intern Portal",
    template: "%s | AUIS IT Intern Portal",
  },
  description: siteDescription,
  applicationName: "AUIS IT Intern Portal",
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "AUIS IT Intern Portal",
    title: "AUIS IT Intern Portal",
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "AUIS IT Intern Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AUIS IT Intern Portal",
    description: siteDescription,
    images: ["/opengraph-image.png"],
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
