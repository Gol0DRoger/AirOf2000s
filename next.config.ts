import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    unoptimized: true,
  },
  experimental: {
    allowedDevOrigins: ["192.168.0.4", "localhost:3000"],
  },
};

export default nextConfig;
