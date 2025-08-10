import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["p16-oec-sg.ibyteimg.com"], // 👈 Thêm domain ở đây
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
