import type { NextConfig } from "next";
const config: NextConfig = {
  // Hosts (Vercel, Render) build and serve from the default .next. A local production
  // smoke test sets KAREGHAR_LOCAL=1 for both build and start, so it uses .next-production
  // and never overwrites the assets of a running dev server.
  distDir: process.env.NODE_ENV === "production" && process.env.KAREGHAR_LOCAL === "1" ? ".next-production" : ".next",
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
