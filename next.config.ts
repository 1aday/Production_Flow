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
    // Skip optimization for external images - they're already optimized at source
    // This prevents the 7-second timeout errors from Next.js image optimization
    unoptimized: true,
    // Cache images longer
    minimumCacheTTL: 3600,
  },
};

export default nextConfig;
