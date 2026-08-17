import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/packs/**": ["../packs/**"],
    "/[slug]": ["../packs/**"],
    "/": ["../packs/**"],
  },
};

export default nextConfig;
