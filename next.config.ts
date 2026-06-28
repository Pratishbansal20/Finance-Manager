import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, Next infers the root
  // from the nearest lockfile and picks up an unrelated one in the home folder.
  turbopack: {
    root: __dirname,
  },
  images: {
    // Google account profile photos.
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};

export default nextConfig;
