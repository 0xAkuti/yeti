import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['yeti-order-manager'],
  experimental: {
    optimizePackageImports: ['@1inch/limit-order-sdk'],
  },
};

export default nextConfig;
