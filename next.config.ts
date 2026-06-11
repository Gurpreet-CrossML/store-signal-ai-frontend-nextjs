import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

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
