import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "pino-pretty"],
  /* config options here */
  images: {
    qualities: [75, 100],
  },
  // for old next versions
  domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com"],

  // remotePatterns: [
  //   {
  //     protocol: "https",
  //     hostname: "lh3.googleusercontent.com",
  //     port: "",
  //   },
  //   {
  //     protocol: "https",
  //     hostname: "avatars.githubusercontent.com",
  //     port: "",
  //   },
  // ],
};

export default nextConfig;
