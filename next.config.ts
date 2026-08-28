import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["exceljs"],
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [{ type: "query", key: "view", value: "dashboard" }],
          destination: "/dashboard",
        },
        {
          source: "/",
          has: [{ type: "query", key: "view", value: "log-hours" }],
          destination: "/log-hours",
        },
        {
          source: "/",
          has: [{ type: "query", key: "view", value: "activities" }],
          destination: "/activities",
        },
        {
          source: "/",
          has: [{ type: "query", key: "view", value: "history" }],
          destination: "/activities",
        },
        {
          source: "/",
          has: [{ type: "query", key: "view", value: "analytics" }],
          destination: "/analytics",
        },
        {
          source: "/",
          has: [{ type: "query", key: "view", value: "interns" }],
          destination: "/admin/interns",
        },
        {
          source: "/",
          has: [
            { type: "query", key: "view", value: "intern" },
            { type: "query", key: "intern", value: "(?<intern>[^&]+)" },
          ],
          destination: "/admin/interns/:intern",
        },
        {
          source: "/",
          has: [{ type: "query", key: "view", value: "semesters" }],
          destination: "/admin/semesters",
        },
        {
          source: "/",
          has: [{ type: "query", key: "view", value: "export" }],
          destination: "/admin/export",
        },
        {
          source: "/",
          has: [{ type: "query", key: "view", value: "audit" }],
          destination: "/admin/audit",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
