import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/packs/**": ["../packs/**"],
    "/skills/**": ["../skills/**"],
    "/hermes": ["../packs/hermes/**"],
  },
};

export default nextConfig;
