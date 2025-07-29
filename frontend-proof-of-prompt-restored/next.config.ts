import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["your-image-source.com"], // or remove if not needed
  },
};

export default nextConfig;
