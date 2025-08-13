import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Allow TikTok image CDN hosts used by product images
    domains: [
      "p16-oec-sg.ibyteimg.com",
      "p16-oec-va.ibyteimg.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ibyteimg.com",
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  typescript: {
    // This will disable the type checking during the build process
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
