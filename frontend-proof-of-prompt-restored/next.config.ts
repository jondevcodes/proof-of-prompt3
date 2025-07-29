import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Optional: allow images from external domains (if needed)
  images: {
    domains: ["your-image-source.com"], // update or remove as needed
  },
  // Optional: set basePath or assetPrefix for GitHub Pages/Render if needed
  // basePath: "/your-subpath",
};

export default nextConfig;
