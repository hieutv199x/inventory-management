import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Allow TikTok image CDN hosts used by product images
    domains: [
      "p16-oec-sg.ibyteimg.com",
      "p16-oec-va.ibyteimg.com",
      'p16-oec-eu-common-no.tiktokcdn-eu.com',
      'p16-oec-eu-common-no.tiktokcdn.com',
      'p16-oec-va-common.tiktokcdn.com',
      'p16-oec-sg-common.tiktokcdn.com',
      'p16-oec-us-common.tiktokcdn.com',
      'p19-oec-va-common.tiktokcdn.com',
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ibyteimg.com",
      },
      {
        protocol: 'https',
        hostname: '*.tiktokcdn*.com',
      },
      {
        protocol: 'https', 
        hostname: '*.tiktokcdn-*.com',
      }
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
