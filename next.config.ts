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

  // A reset link carries its token in the URL. Never send that URL to
  // another site as a Referer (fonts, images, analytics).
  async headers() {
    return [
      {
        source: "/reset-password/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
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
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        port: "",
        pathname: "/s/files/**",
      },
      {
        protocol: "https",
        hostname: "store-signals-ai-dev-s3.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
