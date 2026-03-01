import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for better-sqlite3 (native module) to work in server components
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
