import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Les erreurs ESLint n'empêcheront plus le build de production
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
