import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone", // Optimized for Docker/Coolify deployments
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript type checking during builds
    ignoreBuildErrors: true,
  },
};

export default config;
