import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/my-dasha",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
