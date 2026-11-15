import type { NextConfig } from "next";
const onVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV) || process.cwd().replace(/\\/g, "/").startsWith("/vercel/");
const config: NextConfig = {
  // Vercel expects the default .next output; locally, production builds stay apart from dev.
  // Vercel builds in /vercel/path0; the cwd check covers projects that don't expose the VERCEL variable.
  distDir: process.env.NODE_ENV === "production" && !onVercel ? ".next-production" : ".next",
  serverExternalPackages: ["@node-rs/argon2", "postgres"],
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'" },
      ],
    }];
  },
};
export default config;
