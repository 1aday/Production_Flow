import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "replicate.delivery",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "omqcafltzwrreiocbnrr.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Skip Next.js optimization - use Supabase image transforms instead
    // This avoids slow on-the-fly conversion timeouts
    unoptimized: true,
    minimumCacheTTL: 3600,
  },
};

export default nextConfig;
