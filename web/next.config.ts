import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/packs/**": ["../packs/**"],
    "/skills/**": ["../skills/**"],
    "/[slug]": ["../packs/**"],
    "/": ["../packs/**"],
  },
};

export default nextConfig;
