import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: [
    "openid-client",
    "@prisma/client",
    "@prisma/adapter-pg",
    "bcryptjs",
    "pg",
  ],
};

export default nextConfig;
