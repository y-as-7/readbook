import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    bodySizeLimit: '50mb',
  },
};

export default nextConfig;
