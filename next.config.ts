import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  reactCompiler: true,
  serverExternalPackages: [
    "openid-client",
    "@prisma/client",
    "bcryptjs",
  ],
};

export default nextConfig;
