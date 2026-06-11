import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // src/lib/db.ts reads global-bundle.pem at runtime via a computed path, which
  // output file tracing can't detect — so without this the RDS CA bundle is
  // downloaded at build time but never packaged into the serverless functions
  // (ENOENT at runtime on Vercel). Force it into every route's trace.
  outputFileTracingIncludes: {
    "/**": ["./global-bundle.pem"],
  },

  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storesignal.ai",
        port: "",
        pathname: "/wp-content/**",
      },
    ],
  },
};

export default nextConfig;
