import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone build for optimal Vercel deployment
  output: "standalone",

  // Allow images from the HuggingFace backend if needed
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.hf.space",
      },
    ],
  },
};

export default nextConfig;
